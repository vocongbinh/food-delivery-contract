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
import bodyParser = require("body-parser");
import { Order } from "types/order";
import { v4 } from "uuid";
import path from "path";
import { createReadStream } from "fs";
import { writeFileSync } from "fs";
import { deployItem } from "./scripts/deployNFT";
import { uploadFolderToIPFS, uploadImageToFolder, uploadMetadata } from "./metadata";
import { readdir } from "fs/promises";
import { openWallet } from "./utils";
import { NftCollection } from "./scripts/NftCollection";
import { Address } from "ton-core";
import { getWallet } from "./wallet";
dotenv.config();

const app = express();
const port = 3000;
app.use(cors(
  {
    origin: "*", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}
));
app.use(bodyParser.json());
app.use(express.json());


app.get("/nft-address/:index", async (req: Request, res: Response) => {
  const index = BigInt(req.params.index);
  const address = await NftCollection.getNftAddressByIndex(index);
  res.json({address: address.toString()});
} )

app.post("/deploy-NFT/:address", async (req: Request, res: Response) => {
  const data: Order = req.body;
  const address = req.params.address;
  const imagesFolderPath = path.join(__dirname, "../data/images");
  
  const dishes = data.orderItems.map((orderItem, index) => {
    return {
      trait_type: orderItem.dish.name ,
      value: `Price: ${orderItem.dish.price} x ${orderItem.quantity}`
    }
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
      ...dishes],
    image,
  };
  const metaLink = await uploadMetadata(metaData)
  
  console.log(metaData)
  console.log("meta link: ",metaLink)
  await deployItem(`${metaLink}`, address);
   res.json({"message": "success"})
});
app.post("/deploy-collection", async (req: Request, res: Response) => {
  const wallet = await getWallet()
  const metadataDirectory = path.join(__dirname, "../data/metadata");
  const metadataIpfsHash = await uploadFolderToIPFS(metadataDirectory)
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
  res.json({"Collection deployed": collection.address});

})
app.post("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

getWallet()