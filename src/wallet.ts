import { OpenedContract } from "ton-core";
import { openWallet } from "./utils";
import { WalletContractV4 } from "ton";
import { KeyPair } from "ton-crypto";

let walletInstance:{
    contract: OpenedContract<WalletContractV4>;
    keyPair: KeyPair;
};

export const getWallet = async () => {
  console.log(walletInstance);
  if (!walletInstance) {
    console.log("dd")
    const mnemonic = process.env.MNEMONIC?.split(" ");
    if (!mnemonic) throw new Error('MNEMONIC environment variable is not set.');
    walletInstance = await openWallet(mnemonic);
  }
  return walletInstance;

}