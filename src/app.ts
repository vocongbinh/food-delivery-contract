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
import cors from "cors";
import multer from "multer";
import bodyParser = require("body-parser");
import { Order } from "types/order";
import { v4 } from "uuid";
import path from "path";
import { createReadStream } from "fs";
import { writeFileSync } from "fs";
import { deployItem } from "./scripts/deployNFT";
import { uploadImageToFolder, uploadMetadata } from "./metadata";
import { readdir } from "fs/promises";
import { openWallet } from "./utils";
dotenv.config();

const app = express();
const port = 3000;
const upload = multer({ dest: "uploads/" });
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.post("/deploy-NFT", async (req: Request, res: Response) => {
  const data: Order = req.body;
  const dishes = data.orderItems.map((orderItem) => {
    return {
      trait_type: orderItem.dish.name,
      value: {
        quantity: orderItem.quantity,
        price: orderItem.dish.price,
      },
    };
  });
  const result = await uploadImageToFolder(data.image);
  const image = `https://gateway.pinata.cloud/ipfs/${result}`;
  const metaData = {
    name: v4(),
    description: "This is an order created on TON blockchain",
    attributes: dishes,
    image,
  };
  const metadataDirectory = path.join(__dirname, "../data/metadata");
  const metadataFilePath = path.join(
    metadataDirectory,
    `${metaData.name}.json`
  );
  writeFileSync(metadataFilePath, JSON.stringify(metaData, null, 2), "utf8"); // Path to your .json file
  const readableStreamForFile = createReadStream(metadataFilePath);
  const metaLink = await uploadMetadata(readableStreamForFile)
  console.log(metaData)
  console.log("meta link: ",metaLink)
  await deployItem(`${metaData.name}.json`);
   res.json({"message":metaData})
});
app.post("/deploy-collection", async (req: Request, res: Response) => {
  const wallet = await openWallet(process.env.MNEMONIC!.split(" "));
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: `ipfs://${metadataIpfsHash}/collection.json`,
    commonContentUrl: `ipfs://`,
  };
})
app.post("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
