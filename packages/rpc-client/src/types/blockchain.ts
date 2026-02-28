/** A single unspent transaction output from listunspent */
export interface ListUnspentEntry {
  txid: string;
  vout: number;
  address?: string;
  label?: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
  solvable: boolean;
  desc?: string;
  safe: boolean;
}

/** Script signature in decoded raw transaction */
export interface DecodedScriptSig {
  asm: string;
  hex: string;
}

/** Script pubkey in decoded raw transaction */
export interface DecodedScriptPubKey {
  asm: string;
  hex: string;
  type: string;
  address?: string;
}

/** Input in decoded raw transaction */
export interface DecodedTxInput {
  txid: string;
  vout: number;
  scriptSig: DecodedScriptSig;
  txinwitness?: string[];
  sequence: number;
}

/** Output in decoded raw transaction */
export interface DecodedTxOutput {
  value: number;
  n: number;
  scriptPubKey: DecodedScriptPubKey;
}

/** Decoded raw transaction (getrawtransaction verbose=true) */
export interface DecodedRawTransaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: DecodedTxInput[];
  vout: DecodedTxOutput[];
  hex?: string;
  blockhash?: string;
  confirmations?: number;
  time?: number;
  blocktime?: number;
}
