import { uploadImageToFolder, uploadMetadata } from "./metadata";
import path from "path";
import { deployItem } from "./scripts/deployNFT";
import { Order } from "./types/order";
import { formatDate } from "./utils";
import * as dotenv from 'dotenv';
dotenv.config();

export async function deployNFT(params: { data: Order, address: string, orderId: string }) {
    const { data, address, orderId } = params;
    const imagesFolderPath = path.join(__dirname, "../data/images");
    const dishes = data.orderItems.flatMap((orderItem, index) => {
        return [
            {
                trait_type: "Quantity of " + orderItem.dish.name,
                value: orderItem.quantity,
            },
            {
                trait_type: "Unit Price of " + orderItem.dish.name,
                value: orderItem.dish.price
            }
        ];
    });
    console.log("Started uploading images to IPFS...");
    // const imagesIpfsHash = await uploadFolderToIPFS(imagesFolderPath);
    const featuredImg = data.orderItems[0].dish.imageUrl.split(", ")[0];
    const result = await uploadImageToFolder(featuredImg);
    const image = `ipfs://${result}`;
    // const image = `ipfs://${imagesIpfsHash}/dish.jpg`;

    const metaData = {
        name: orderId,
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
                trait_type: "Created At",
                value: formatDate(new Date()),
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
    await deployItem(`${metaLink}`,BigInt(2), address);
    return {result: "success"};
}