import type { TxOutput } from './transaction.js';
import type { DDOpReturnData } from './op-return.js';

/** UTXO classification categories */
export type OutputClass = 'standard' | 'dd_token' | 'dd_collateral' | 'dd_metadata';

/** A transaction output with classification and optional DD amount */
export interface ClassifiedOutput extends TxOutput {
  /** Output index (same as TxOutput.n) */
  index: number;
  /** UTXO classification */
  classification: OutputClass;
  /** DD amount in cents (only set for dd_token outputs) */
  ddAmountCents?: bigint;
}

/** Full classified transaction with convenience arrays */
export interface ClassifiedTransaction {
  txid: string;
  version: number;
  isDigiDollar: boolean;
  txType: 'mint' | 'transfer' | 'redeem' | null;
  opReturn: DDOpReturnData | null;
  outputs: ClassifiedOutput[];
  /** Zero-value P2TR outputs representing DD ownership */
  tokens: ClassifiedOutput[];
  /** P2TR outputs with value > 0 holding locked DGB */
  collateral: ClassifiedOutput[];
  /** OP_RETURN outputs containing DD metadata */
  metadata: ClassifiedOutput[];
  /** Regular DGB outputs safe to spend */
  standard: ClassifiedOutput[];
}
