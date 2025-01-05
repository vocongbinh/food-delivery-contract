import { TonClient, WalletContractV4 } from 'ton';
import { Address, beginCell, Cell, OpenedContract } from 'ton-core';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
export const nftCollectionAddress = Address.parse('EQBQJeJuna9qDQEvDLEVamTSnhemKlMa4N2eJUZX6EBwVpZ4');
//https://testnet.explorer.tonnft.tools/collection/EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4
const toncenterBaseEndpoint: string = "https://testnet.toncenter.com";

const client = new TonClient({
	endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
	apiKey: process.env.TONCENTER_API_KEY,
  });

  export type OpenedWallet = {
	contract: OpenedContract<WalletContractV4>;
	keyPair: KeyPair;
  };

export async function 	getNextItem() {

	let { stack } = await client.callGetMethod(
		nftCollectionAddress, 
		'get_collection_data'
	);
	console.log(stack)
	let nextItemIndex = stack.readBigNumber();
	console.log(nextItemIndex)

	return nextItemIndex;
}
export const sleep = (ms:number) => new Promise((resolve) => setTimeout(resolve, ms));
function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize));
    buff = buff.subarray(chunkSize);
  }
  return chunks;
}

function makeSnakeCell(data: Buffer): Cell {
	const chunks = bufferToChunks(data, 127);
  
	if (chunks.length === 0) {
	  return beginCell().endCell();
	}
  
	if (chunks.length === 1) {
	  return beginCell().storeBuffer(chunks[0]).endCell();
	}
  
	let curCell = beginCell();
  
	for (let i = chunks.length - 1; i >= 0; i--) {
	  const chunk = chunks[i];
  
	  curCell.storeBuffer(chunk);
  
	  if (i - 1 >= 0) {
		const nextCell = beginCell();
		nextCell.storeRef(curCell);
		curCell = nextCell;
	  }
	}
  
	return curCell.endCell();
  }
export function encodeOffChainContent(content: string) {
  let data = Buffer.from(content);
  const offChainPrefix = Buffer.from([0x01]);
  data = Buffer.concat([offChainPrefix, data]);
  return makeSnakeCell(data);
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

export function generateOrderId() {
	const timestamp = Date.now(); // Lấy thời gian hiện tại
	const random = Math.floor(Math.random() * 1000); // Số ngẫu nhiên
	return `ORD-${timestamp}-${random}`; // Kết hợp
  }

export function formatDate(dateString: string | Date) {
	const date = new Date(dateString);
	const options: Intl.DateTimeFormatOptions = {
	  year: "numeric",
	  month: "long",
	  day: "numeric",
	};
	return date.toLocaleDateString("en-US", options);
  }