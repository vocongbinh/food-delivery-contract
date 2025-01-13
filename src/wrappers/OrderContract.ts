import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';

export type OrderContractConfig = {
    owner: Address;
    customer: Address;
    order_id: string;
    name: string;
    image: string;
    quantity: number;
    price: bigint;
};
export const Opcodes = {
    updateStatus: 1,
};
export function orderContractConfigToCell(config: OrderContractConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeAddress(config.customer)
        .storeRef(beginCell().storeStringTail(config.order_id).endCell())
        .storeRef(beginCell().storeStringTail(config.name).endCell())
        .storeRef(beginCell().storeStringTail(config.image).endCell())
        .storeUint(config.quantity, 32)
        .storeCoins(config.price)
        .storeUint(0, 8) // Initial status: PENDING
        .endCell();
}

export class OrderContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new OrderContract(address);
    }

    static createFromConfig(config: OrderContractConfig, code: Cell, workchain = 0) {
        const data = orderContractConfigToCell(config);
        const init = { code, data };
        return new OrderContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreateOrder(
        provider: ContractProvider,
        via: Sender,
        opts: {
            customer: Address;
            order_id: string;
            name: string;
            image: string;
            quantity: number;
            price: bigint;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeAddress(opts.customer)
                .storeRef(beginCell().storeStringTail(opts.order_id).endCell())
                .storeRef(beginCell().storeStringTail(opts.name).endCell())
                .storeRef(beginCell().storeStringTail(opts.image).endCell())
                .storeUint(opts.quantity, 32)
                .storeCoins(opts.price)
                .endCell(),
        });
    }

    async getOrderInfo(provider: ContractProvider) {
        const result = await provider.get('get_order_info', []);
        return {
            owner: result.stack.readAddress(),
            customer: result.stack.readAddress(),
            order_id: result.stack.readString(),
            name: result.stack.readString(),
            image: result.stack.readString(),
            quantity: result.stack.readNumber(),
            price: result.stack.readNumber(),
            status: result.stack.readNumber(),
        };
    }
    
    async sendUpdateOrderStatus(provider: ContractProvider, via: Sender, status: number) {
        await provider.internal(via, {
            value: toNano(0.02),
            body: beginCell().storeUint(Opcodes.updateStatus, 32).storeUint(status, 8).endCell(),
        });
    }

}
