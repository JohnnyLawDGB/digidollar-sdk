import type { UTXO, DDTokenUTXO } from '@digidollar/tx-builder';

/** Classified UTXO set partitioned by type */
export interface ClassifiedUTXOSet {
  /** Standard DGB UTXOs — safe to spend for fees/collateral */
  standard: UTXO[];
  /** DD token UTXOs — zero-value P2TR representing DD ownership */
  ddTokens: DDTokenUTXO[];
  /** DD collateral UTXOs — locked DGB backing positions */
  ddCollateral: UTXO[];
  /** Total standard balance in sats */
  standardBalance: bigint;
  /** Total DD balance in cents */
  ddBalance: bigint;
}
