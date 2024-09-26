import {
    beginCell, 
    toNano,
    Address,
  } from "ton-core";
import qs from "qs";
import qrcode from "qrcode-terminal";

import { getNextItem } from "../utils";

export async function deployItem(commonContentUrl: string) { 
    /////////////////////////////////////// collect data here ////////////////////////////////////////////
 
    // 1) Your address - NFT will store owner address, so be the owner!!
    // You can find you testnet Address in your Wallet
    const ownerAddress = Address.parse('0QAmzEMTk3SIjRAbMeJWDFYLNwkXp4P2Fu8iH0Pik5KOQUpJ');
    //const ownerAddress = Address.parse('input your adress here');
    //take next Item  
    
    const itemIndex = await getNextItem();
    console.log(commonContentUrl)
    // no image just json
  


    const body = beginCell();
    // op == 1  = deploy single NFT
    body.storeUint(1, 32);
    // query_id let it be 0
    body.storeUint(0, 64);

    // index - take next index from file TBD
    body.storeUint(itemIndex, 64);
    
    body.storeCoins(toNano("0.05"));

    const nftItemContent = beginCell();
    nftItemContent.storeAddress(ownerAddress);

    const uriContent = beginCell();
    uriContent.storeBuffer(Buffer.from(commonContentUrl));
    nftItemContent.storeRef(uriContent.endCell());

    body.storeRef(nftItemContent.endCell());
    const readyBody = body.endCell();



    /////////////////////////////////////// Deploy link //////////////////////////////////////

	console.log("Scan QR code below with your Tonkeeper Wallet")

    const collectionAddress = Address.parse('kQAx1eo8OnGv3CFjpR8214fAECIupkhGD4UKjxYI8HsMLLqy');

    let deployLink =
    'https://app.tonkeeper.com/transfer/' +
    collectionAddress.toString({
        testOnly: true,
    }) +
    "?" +
    qs.stringify({
        text: "tonspeedrun",
        amount: toNano("0.1").toString(10),
        bin: readyBody.toBoc({idx: false}).toString("base64"),
    });



    qrcode.generate(deployLink, {small: true }, (qr) => {
        console.log(qr);
    });

}
