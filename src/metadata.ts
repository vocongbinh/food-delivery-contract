import pinataSDK, { PinataPinOptions } from "@pinata/sdk";
import axios from "axios";
import { readdirSync, createReadStream, unlinkSync, ReadStream } from "fs";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
const sharp = require("sharp")
function generateUniqueFilename(baseName: string, extension: string) {
  const timestamp = Date.now();
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  const uniqueName = `${baseName}_${timestamp}_${randomNumber}.${extension}`;
  return uniqueName;
}
export async function uploadImageToFolder(file: string): Promise<string> {
  const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET,
  });
  const response = await axios.get(file, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  const resizeBuffer = await sharp(buffer)
        .resize(300, 300, {
            fit: 'inside', 
        }).toBuffer()
  const readableStreamForFile = Readable.from(buffer)
  console.log(resizeBuffer)
  const options:PinataPinOptions = {
    pinataMetadata: {
      name: "image.jpg", 
    },
    pinataOptions: {
      cidVersion: 0, 
    },
  };
  const res = await pinata.pinFileToIPFS(readableStreamForFile , options);
  return res.IpfsHash;
}

export async function uploadFolderToIPFS(folderPath: string): Promise<string> {
  const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET,
  });

  const response = await pinata.pinFromFS(folderPath);
  return response.IpfsHash;
}

// export async function uploadImageToFolder(folderPath: string): Promise<string> {
//   const pinata = new pinataSDK({
//     pinataApiKey: process.env.PINATA_API_KEY,
//     pinataSecretApiKey: process.env.PINATA_API_SECRET,
//   });
//   await pinata.pinFileToIPFS;
//   const response = await pinata.pinFromFS(folderPath);
//   return response.IpfsHash;
// }



export async function uploadMetadata(filePath:any): Promise<string> {
   const options = {
    pinataMetadata: {
      name: generateUniqueFilename("meta", "json"), // Tên của file
    },
  };
  const pinata = new pinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_API_SECRET,
  });

  const response = await pinata.pinJSONToIPFS(filePath, options);
  return response.IpfsHash;
}

export async function updateMetadataFiles(
  metadataFolderPath: string,
  // imagesIpfsHash: string
): Promise<void> {
  const files = readdirSync(metadataFolderPath);
  files.forEach(async (filename, index) => {
    const filePath = path.join(metadataFolderPath, filename);
    const file = await readFile(filePath);
    const metadata = JSON.parse(file.toString());
    // metadata.image =
    //   index != files.length - 1
    //     ? `ipfs://${imagesIpfsHash}/${index}.jpg`
    //     : `ipfs://${imagesIpfsHash}/logo.jpg`;

    await writeFile(filePath, JSON.stringify(metadata));
  });
}
