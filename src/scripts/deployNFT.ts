import {
    beginCell, 
    toNano,
    Address,
  } from "ton-core";
import qs from "qs";
import qrcode from "qrcode-terminal";

import { getNextItem, openWallet } from "../utils";
import { mintParams, NftCollection } from "./NftCollection";
import { NftItem } from "./NftItem";
import { getWallet } from "../wallet";
export const collectionAddress = Address.parse("kQB-gihgMvh2R-2tlZjaCEWw8-wPQKFsL0XW60QIby10MTYe")
export async function deployItem(commonContentUrl: string, destAddress: string ) { 
    ////////////////////////////////////const wallet = await openWallet(process.env.MNEMONIC!.split(" "));/// collect data here ////////////////////////////////////////////
    const wallet = await getWallet()
    // 1) Your address - NFT will store owner address, so be the owner!!
    // You can find you testnet Address in your Wallet
    const ownerAddress = Address.parse('0QDREisYb3hWcNevBoAopiS2UubbDp174WF0_v2XSZd9gcwL');
    
    //const ownerAddress = Address.parse('input your adress here');
    //take next Item  
    
    const itemIndex = await getNextItem();
    console.log(commonContentUrl)
    // no image just json
  
    const params:mintParams= {
        queryId: 0,
        itemOwnerAddress: wallet.contract.address,
        itemIndex: itemIndex,
        amount: toNano("0.05"),
        commonContentUrl: commonContentUrl
    } 
    const nftItem = new NftItem(collectionAddress);

    await nftItem.deploy(wallet, params, destAddress);
    


}
