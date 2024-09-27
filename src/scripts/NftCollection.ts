import {
  Address,
  Cell,
  internal,
  beginCell,
  contractAddress,
  StateInit,
  SendMode,
  TupleItem,
} from "ton-core";
import { openWallet, encodeOffChainContent, OpenedWallet, nftCollectionAddress, sleep } from "../utils";
import { toncenter } from "./getCollectionData";
export type collectionData = {
  ownerAddress: Address;
  royaltyPercent: number;
  royaltyAddress: Address;
  nextItemIndex: number;
  collectionContentUrl: string;
  commonContentUrl: string;
};
export type mintParams = {
  queryId: number | null ;
  itemOwnerAddress: Address;
  itemIndex: bigint;
  amount: bigint;
  commonContentUrl: string;
};

export class NftCollection {
  private collectionData: collectionData;
  constructor(collectionData: collectionData) {
    this.collectionData = collectionData;
  }

  private createCodeCell(): Cell {
    const NftCollectionCodeBoc =
      "te6cckECFAEAAh8AART/APSkE/S88sgLAQIBYgkCAgEgBAMAJbyC32omh9IGmf6mpqGC3oahgsQCASAIBQIBIAcGAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNDwoCASAMCwA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBIA4NABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkExIREAA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiN0CayQ==";
    return Cell.fromBase64(NftCollectionCodeBoc);
  }
  private createDataCell(): Cell {
    const data = this.collectionData;
    const dataCell = beginCell();
    dataCell.storeAddress(data.ownerAddress);
    dataCell.storeInt(data.nextItemIndex, 64);
    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(data.collectionContentUrl);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(data.commonContentUrl));

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());
    dataCell.storeRef(contentCell);
    const NftItemCodeCell = Cell.fromBase64(
      "te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu"
    );

    dataCell.storeRef(NftItemCodeCell);
    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);
    const royaltyCell = beginCell();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(data.royaltyAddress);
    dataCell.storeRef(royaltyCell);

    return dataCell.endCell();
  }
  public get stateInit(): StateInit {
    const code = this.createCodeCell();
    const data = this.createDataCell();

    return { code, data };
  }
  public get address(): Address {
    return contractAddress(0, this.stateInit);
  }
  public async deploy(wallet: OpenedWallet) {
    const seqno = await wallet.contract.getSeqno();
    // await sleep(10000)
    const maxRetries = 5;
    const retryDelay = 1000;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await wallet.contract.sendTransfer({
          seqno,
          secretKey: wallet.keyPair.secretKey,
          messages: [
            internal({
              value: "0.05",
              to: this.address,
              init: this.stateInit,
            }),
          ],
          sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        });
        console.log("Transaction sent successfully");
        return; // Exit if the transaction was successful
      } catch (e: any) {
        console.error("Error sending transaction:", e.message);

        // Check if it's a rate limit error (status 429)
        if (e.response && e.response.status === 429) {
          const waitTime = retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(
            `Rate limit exceeded. Retrying in ${waitTime / 1000} seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          throw e; // Rethrow other errors
        }
      }
    }

    return seqno;
  }

  
  public createMintBody(params: mintParams): Cell {
    const body = beginCell();
    body.storeUint(1, 32);
    body.storeUint(params.queryId || 0, 64);
    body.storeUint(params.itemIndex, 64);
    body.storeCoins(params.amount);
    const nftItemContent = beginCell();
    nftItemContent.storeAddress(params.itemOwnerAddress);
    const uriContent = beginCell();
    uriContent.storeBuffer(Buffer.from(params.commonContentUrl));
    nftItemContent.storeRef(uriContent.endCell());
    body.storeRef(nftItemContent.endCell());
    return body.endCell();
  }
  static async getNftAddressByIndex(index:bigint) {
    const params:TupleItem[] = [
      {
        type: 'int',
        value: index
      }
    ]
    let { stack } = await toncenter.callGetMethod(
      nftCollectionAddress, 
      'get_nft_address_by_index',
      params
    );
    const address = stack.readAddress();
    console.log(address);
    return address;
  }
  
}

export function createMintBody(params: mintParams): Cell {
  const body = beginCell();
  body.storeUint(1, 32);
  body.storeUint(params.queryId || 0, 64);
  body.storeUint(params.itemIndex, 64);
  body.storeCoins(params.amount);
  const nftItemContent = beginCell();
  nftItemContent.storeAddress(params.itemOwnerAddress);
  const uriContent = beginCell();
  uriContent.storeBuffer(Buffer.from(params.commonContentUrl));
  nftItemContent.storeRef(uriContent.endCell());
  body.storeRef(nftItemContent.endCell());
  return body.endCell();
}