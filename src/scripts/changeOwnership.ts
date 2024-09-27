import { Address, beginCell } from "ton"

export const OperationCodes = {
    transfer: 0x5fcc3d14,
    getStaticData: 0x2fcb26a2,
    getStaticDataResponse: 0x8b771735,
    GetRoyaltyParams: 0x693d3950,
    GetRoyaltyParamsResponse: 0xa8cb00ad,
    EditContent: 0x1a0b9d51,
    TransferEditorship: 0x1c04412a
}

const getTransferParams = (params: { queryId?: number, newOwner: Address, responseTo?: Address, forwardAmount?: bigint }) => {
    const msgBody = beginCell();
    msgBody.storeUint(OperationCodes.transfer, 32); // op-code
    msgBody.storeUint(params.queryId || 0, 64);
    msgBody.storeUint(params.queryId || 0, 64);
    msgBody.storeAddress(params.newOwner);
    msgBody.storeAddress(params.responseTo || null);
    msgBody.storeBit(false); // no custom payload
    msgBody.storeCoins(params.forwardAmount || 0);
    msgBody.storeBit(0); // no forward_payload
    return msgBody
}