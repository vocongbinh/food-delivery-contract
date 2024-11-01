import * as dotenv from "dotenv";
// import { handle429, OpenedWallet, openWallet } from "./utils";
// import { updateMetadataFiles, uploadFolderToIPFS, uploadImageToFolder } from "./metadata";
// import { GetGemsSaleData, NftCollection } from "./contracts/NftCollection";
// import { waitSeqno } from "./delay";
// import { readdir } from "fs/promises";
// import { toNano } from "ton-core";
// import { NftItem } from "./contracts/NftItem";
// import { NftMarketplace } from "./contracts/NftMarketplace";
// import { NftSale } from "./contracts/NftSale";
import express, { Request, Response } from "express";
import { JettonMaster, TonClient } from "ton";
import cors from "cors";
import bodyParser = require("body-parser");
import { Order } from "types/order";
import { v4 } from "uuid";
import path from "path";
import { createReadStream } from "fs";
import { writeFileSync } from "fs";
import { deployItem } from "./scripts/deployNFT";
import {
  uploadFolderToIPFS,
  uploadImageToFolder,
  uploadMetadata,
} from "./metadata";
import { readdir } from "fs/promises";
import { openWallet, sleep } from "./utils";
import { NftCollection } from "./scripts/NftCollection";
import { Address, beginCell, Cell, internal, SendMode, toNano } from "ton-core";
import { Address as Address2, Sender } from "@ton/core";
import { getWallet } from "./wallet";
import {
  AssetsSDK,
  createApi,
  createSender,
  importKey,
  JettonWallet,
} from "@ton-community/assets-sdk";
import TonWeb from "tonweb";
import { Maybe } from "ton-core/dist/utils/maybe";
import { Jetton } from "./scripts/jetton";
dotenv.config();
const app = express();
const port = 3000;
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options('*',  (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
} );
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
app.use(express.json());
const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
    apiKey: process.env.TONCENTER_API_KEY,
  })
);
const client = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC", // URL của node TON
  apiKey: process.env.TONCENTER_API_KEY // API key nếu cần thiết
});
console.log("key", process.env.TONCENTER_API_KEY);
app.get("/nft-address/:index", async (req: Request, res: Response) => {
  const index = BigInt(req.params.index);
  const address = await NftCollection.getNftAddressByIndex(index);
  res.json({ address: address.toString() });
});

app.post("/deploy-NFT/:address", async (req: Request, res: Response) => {
  const data: Order = req.body;
  const address = req.params.address;
  const imagesFolderPath = path.join(__dirname, "../data/images");

  const dishes = data.orderItems.map((orderItem, index) => {
    return {
      trait_type: orderItem.dish.name,
      value: `Price: ${orderItem.dish.price} x ${orderItem.quantity}`,
    };
  });
  console.log("Started uploading images to IPFS...");
  const imagesIpfsHash = await uploadFolderToIPFS(imagesFolderPath);
  const image = `ipfs://${imagesIpfsHash}/dish.jpg`;

  const metaData = {
    name: v4(),
    description: "This is an order created on TON blockchain",
    attributes: [
      {
        trait_type: "Name",
        value: data.name,
      },
      {
        trait_type: "Address",
        value: data.address,
      },
      {
        trait_type: "Phone",
        value: data.phone,
      },
      ...dishes,
    ],
    image,
  };
  const metaLink = await uploadMetadata(metaData);

  console.log(metaData);
  console.log("meta link: ", metaLink);
  await deployItem(`${metaLink}`, address);
  res.json({ message: "success" });
});
app.post("/deploy-collection", async (req: Request, res: Response) => {
  const wallet = await getWallet();
  const metadataDirectory = path.join(__dirname, "../data/metadata");
  const metadataIpfsHash = await uploadFolderToIPFS(metadataDirectory);
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: `ipfs://${metadataIpfsHash}/collection.json`,
    commonContentUrl: `ipfs://`,
  };
  const collection = new NftCollection(collectionData);
  await collection.deploy(wallet);
  console.log(`Collection deployed: ${collection.address}`);
  res.json({ "Collection deployed": collection.address });
});

app.post("/send-jetton/:address", async (req: Request, res: Response) => {
  const address = req.params.address;
  const wallet = await getWallet();
  await sleep(5000);
  const seqno = await wallet.contract.getSeqno();
  console.log(seqno);
  await sleep(5000);
  console.log('haha')
  
  try {
    await wallet.contract.sendTransfer({
      seqno: seqno ,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: "0.05",
          to: Address.parse("kQAoj7j8Sy0enWZcjy6Je7G_ixzlCh2QaCThAv67vOkEGAbk"),
          body: Jetton.createTransferBody({
            newOwner: Address.parse(address),
            amount: toNano(1),
            forwardAmount: toNano(0.05),
            responseTo: wallet.contract.address,
          }),
        }),
      ],
      sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
    });
  }
  catch(e) {
    console.log("Error", e);

  }
  console.log("send jetton success")
 
  res.json({ message: "success" });
});

app.post("/exchange-jetton/:address", async (req: Request, res: Response) => {
  const address = req.params.address;
  const jettonMaster = new JettonMaster(Address.parse("kQAoj7j8Sy0enWZcjy6Je7G_ixzlCh2QaCThAv67vOkEGAbk"))
  const wallet = await getWallet();

  const jettonWallet = await client.open(jettonMaster).getWalletAddress(Address.parse("0QAmzEMTk3SIjRAbMeJWDFYLNwkXp4P2Fu8iH0Pik5KOQUpJ"))
  res.json({"jetton wallet": jettonWallet.toString()})
  // const seqno = await wallet.contract.getSeqno();
  // console.log(seqno); // 0
  // await sleep(5000);
  // await wallet.contract.sendTransfer({
  //   seqno,
  //   secretKey: wallet.keyPair.secretKey,
  //   messages: [
  //     internal({
  //       value: "0.05",
  //       to: Address.parse("kQAoj7j8Sy0enWZcjy6Je7G_ixzlCh2QaCThAv67vOkEGAbk"),
  //       body: Jetton.createExchangeBody({
  //         newOwner: Address.parse(address),
  //         amount: toNano(1),
  //         forwardAmount: toNano(0.05),
  //         responseTo: wallet.contract.address,
  //       }),
  //     }),
  //   ],
  //   sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
  // });
  // res.json({ message: "success" });
});


app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

getWallet();
