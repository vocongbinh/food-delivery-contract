import { TonClient, WalletContractV4 } from 'ton';
import { Address } from 'ton-core';
import { mnemonicToPrivateKey } from 'ton-crypto';
export const nftCollectionAddress = Address.parse('EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4');
//https://testnet.explorer.tonnft.tools/collection/EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4
const toncenterBaseEndpoint: string = "https://testnet.toncenter.com";

const client = new TonClient({
	endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
	apiKey: process.env.TONCENTER_API_KEY,
  });


export async function getNextItem() {

	let { stack } = await client.callGetMethod(
		nftCollectionAddress, 
		'get_collection_data'
	);
	let nextItemIndex = stack.readBigNumber();

	return nextItemIndex;
}


export async function openWallet(mnenonics: string[]) {
	const keyPair = await mnemonicToPrivateKey(mnenonics);
	const wallet = await WalletContractV4.create({
	  publicKey: keyPair.publicKey,
	  workchain: 0
	})
	const contract = client.open(wallet);
	return {contract, keyPair}
  }

