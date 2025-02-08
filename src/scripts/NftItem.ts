import { Address, beginCell, Cell, internal, SendMode, toNano, contractAddress } from "ton-core";
import { OpenedWallet, sleep } from "../utils";
import { NftCollection, createMintBody, mintParams } from "./NftCollection";
import { TonClient } from "ton";
import { nextTick } from "process";
import { StateInit } from "ton-core";
import { Jetton } from "./jetton";

export class NftItem {
  private collection: Address;

  constructor(collection: Address) {
    this.collection = collection;
  }

  private createCodeCell(): Cell {
    const NftItemCodeBoc =
      "te6ccgECDQEAAdAAART/APSkE/S88sgLAQIBYgIDAgLOBAUACaEfn+AFAgEgBgcCASALDALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCAkAET6RDBwuvLhTYAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viCgBycIIQi3cXNQXIy/9QBM8WECSAQHCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAAIICjjUm8AGCENUydtsQN0QAbXFwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AJMwMjTiVQLwAwA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAB0A8jLP1jPFgHPFszJ7VSA=";
    return Cell.fromBase64(NftItemCodeBoc);
  }


  public async deploy(
    wallet: OpenedWallet,
    params: mintParams,
    destAddress: string

  ): Promise<number> {
    //    const maxRetries = 100 ;
    // const retryDelay = 10000; // 1 giây giữa mỗi lần thử lại

    // for (let attempt = 0; attempt < maxRetries; attempt++) {
    //   try {
    // Đợi seqno trả về
    await sleep(2000)

    const seqno = await wallet.contract.getSeqno();
    await sleep(2000)
    // Sau khi có seqno, gửi giao dịch
    await wallet.contract.sendTransfer({
      seqno,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: "0.05",
          to: this.collection,
          body: createMintBody(params),
        }),
        internal({
          value: "0.05",
          to: Address.parse("kQAoj7j8Sy0enWZcjy6Je7G_ixzlCh2QaCThAv67vOkEGAbk"),
          body: Jetton.createTransferBody({
            newOwner: Address.parse(destAddress),
            amount: toNano(1),
            forwardAmount: toNano(0.05),
            responseTo: wallet.contract.address,
          }),
        }),
      ],
      sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
    });
    await sleep(8000)
    // const stateInit: StateInit = {
    //   data: createMintBody(params),
    //   code: this.createCodeCell(),
    // }

    // const nftAddres = contractAddress(0, stateInit)
    // console.log("nft address", nftAddres.toString())
    const nftAddress = await NftCollection.getNftAddressByIndex(params.itemIndex)
    console.log(nftAddress.toString())
    const newOwner = Address.parse(destAddress)
    try {


      const seq = await NftItem.transfer(seqno + 1, wallet, nftAddress, newOwner)
      console.log(seq)
    }
    catch (e) {
      console.log("Error", e);
    }

    //     console.log(`Transfer successful on attempt ${attempt + 1}`);
    //     return 0; // Nếu thành công, thoát khỏi hàm

    //   } catch (e) {
    //     if (e.response && e.response.status === 429) {
    //       console.error(`Attempt ${attempt + 1} failed: Too many requests, retrying...`);

    //       // Đợi một thời gian trước khi thử lại nếu gặp lỗi 429
    //       if (attempt < maxRetries - 1) {
    //         await new Promise(resolve => setTimeout(resolve, retryDelay));
    //       } else {
    //         console.error(`Failed after ${maxRetries} attempts`);
    //         return -1; // Trả về lỗi sau số lần thử tối đa
    //       }

    //     } else {
    //       console.error(`Attempt ${attempt + 1} failed:`, e);
    //       return -1; // Nếu lỗi khác không phải 429, thoát với lỗi
    //     }
    //   }
    // }



    return 0;



  }
  static async getAddressByIndex(
    collectionAddress: Address,
    itemIndex: number
  ): Promise<Address> {
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: process.env.TONCENTER_API_KEY,
    });
    const response = await client.runMethod(
      collectionAddress,
      "get_nft_address_by_index",
      [{ type: "int", value: BigInt(itemIndex) }]
    );
    return response.stack.readAddress();
  }
  static createTransferBody(params: {
    newOwner: Address;
    responseTo?: Address;
    forwardAmount?: bigint;
  }): Cell {
    const msgBody = beginCell();
    msgBody.storeUint(0x5fcc3d14, 32); // op-code
    msgBody.storeUint(0, 64); // query-id
    msgBody.storeAddress(params.newOwner);
    msgBody.storeAddress(params.responseTo || null);
    msgBody.storeBit(false); // no custom payload
    msgBody.storeCoins(params.forwardAmount || 0);
    msgBody.storeBit(0); // no forward_payload

    return msgBody.endCell();
  }
  static async transfer(
    seqno: number,
    wallet: OpenedWallet,
    nftAddress: Address,
    newOwner: Address
  ): Promise<number> {
    await sleep(3000)
    // const seqno = await wallet.contract.getSeqno();
    // console.log("seq", seqno)
    // await sleep(3000)
    await wallet.contract.sendTransfer({
      seqno,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: "0.05",
          to: nftAddress,
          body: this.createTransferBody({
            newOwner,
            responseTo: wallet.contract.address,
            forwardAmount: toNano("0.02"),
          }),
        }),
      ],
      sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
    });
    return seqno;
  }
}
