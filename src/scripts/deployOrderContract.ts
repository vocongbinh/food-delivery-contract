import { Address, toNano } from '@ton/core';
import { OrderContract, OrderContractConfig } from '../wrappers/OrderContract';
import { OpenedWallet } from 'utils';
import { beginCell, Cell, contractAddress, internal, SendMode, StateInit } from 'ton-core';
import { sleep } from '@ton-community/assets-sdk/dist/utils';

export class DfoodContract {
    private data: OrderContractConfig
    constructor(data: OrderContractConfig) {
        this.data = data
    }

    private createDataCell(): Cell {
        const config = this.data;
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

    private createCodeCell(): Cell {
        return Cell.fromBase64(
            "te6ccgECBwEAATkAART/APSkE/S88sgLAQIBYgIDA/TQMzHQ0wMx+kAw7UTQ+kD6QNTU1NMf+gDTBzBTZ8cFjjJfCAH6QNTU1NMf+gAwIcIA8uBoIMIA8uBpcMhQCM8WUAbPFhTMEszMyx8B+gLLB8ntVOBUeHZSIscFWccFsfLgZQnTHyHAAeMCIcAC4wIywAPjAl8JhA/y8AQFBgAnoOWh2omh9IH0gampqaY/9AGmDmEAWjE4OAbTBzAgwQTy4GYQVxBGEDVEMMhQCM8WUAbPFhTMEszMyx8B+gLLB8ntVABcMTJRdscF8uBn0x8wIMIA8uBoEFdVFMhQCM8WUAbPFhTMEszMyx8B+gLLB8ntVABiUXbHBfLgZwb6ADAgwgDy4GkQVxBGEDVEA8hQCM8WUAbPFhTMEszMyx8B+gLLB8ntVA=="
        );
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
        await sleep(3000)
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
        }
    }

    public async createOrderContract(wallet: OpenedWallet, opts: {
        owner: Address;
        customer: Address;
        order_id: string;
        name: string;
        image: string;
        quantity: number;
        price: bigint;
        value: bigint;
    }) {
        const seqno = await wallet.contract.getSeqno();
        await sleep(3000)
        try {
            await wallet.contract.sendTransfer({
                seqno,
                secretKey: wallet.keyPair.secretKey,
                messages: [
                    internal({
                        value: opts.value,
                        to: this.address,
                        body: beginCell()
                            .storeAddress(opts.owner)
                            .storeAddress(opts.customer)
                            .storeRef(beginCell().storeStringTail(opts.order_id).endCell())
                            .storeRef(beginCell().storeStringTail(opts.name).endCell())
                            .storeRef(beginCell().storeStringTail(opts.image).endCell())
                            .storeUint(opts.quantity, 32)
                            .storeCoins(opts.price)
                            .endCell(),
                    }),
                ],
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            });
            console.log("Transaction sent successfully");
            return; // Exit if the transaction was successful
        } catch (e: any) {
            console.error("Error sending transaction:", e.message);
        }
    }

}
