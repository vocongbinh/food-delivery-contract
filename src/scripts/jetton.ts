import { Address, beginCell, Cell } from "ton";

export class Jetton {
  static createTransferBody(params: {
    newOwner: Address;
    responseTo: Address;
    amount: bigint;
    forwardAmount?: bigint;
  }): Cell {
    const masterMsg = beginCell();
    masterMsg.storeUint(0x178d4519, 32);
    masterMsg.storeUint(0, 64);
    masterMsg.storeCoins(params.amount); // Số lượng jettons cần mint
    masterMsg.storeAddress(params.responseTo);
    masterMsg.storeAddress(params.responseTo);
    masterMsg.storeCoins(0);
    masterMsg.endCell();
    const msgBody = beginCell();
    msgBody.storeUint(21, 32);
    msgBody.storeUint(0, 64); // query-id
    msgBody.storeAddress(params.newOwner);
    msgBody.storeCoins(params.forwardAmount || 0);
    msgBody.storeRef(masterMsg);
    return msgBody.endCell();
  }
  static createExchangeBody(params: {
    newOwner: Address;
    responseTo: Address;
    amount: bigint;
    forwardAmount?: bigint;
  }): Cell {
    const msgBody = beginCell();
    msgBody.storeUint(0xf8a7ea5, 32);
    msgBody.storeUint(0, 64); // query-id
    msgBody.storeCoins(params.amount); 
    msgBody.storeAddress(params.newOwner);
    msgBody.storeAddress(params.responseTo);
    msgBody.storeDict(null)
    msgBody.storeCoins( 0);
    return msgBody.endCell();
  }
}
