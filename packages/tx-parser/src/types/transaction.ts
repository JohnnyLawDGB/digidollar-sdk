/**
 * Decoded transaction interfaces matching `getrawtransaction verbose=true` output.
 * These are the input types that users provide to the classifier.
 */

export interface ScriptSig {
  asm: string;
  hex: string;
}

export interface ScriptPubKey {
  asm: string;
  hex: string;
  type: string;
  address?: string;
}

export interface TxInput {
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  txinwitness?: string[];
  sequence: number;
}

export interface TxOutput {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
}

export interface DecodedTx {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
}
