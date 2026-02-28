import type {
  OraclePrice, AllOraclePrices, DDBalance, DDPosition,
  RedemptionInfo, CollateralEstimate, DDStats, DecodedRawTransaction,
} from '@digidollar/rpc-client';

/** A raw UTXO from the backend */
export interface RawUTXO {
  txid: string;
  vout: number;
  address?: string;
  scriptPubKey: string;
  /** Value in satoshis */
  valueSats: bigint;
  confirmations: number;
}

/**
 * Pluggable backend interface for chain data access.
 * Default implementation wraps DigiDollarRPC.
 * Future implementations: Electrum, Blockbook, etc.
 */
export interface Backend {
  /** List unspent outputs for wallet addresses */
  listUnspent(minconf?: number, maxconf?: number, addresses?: string[]): Promise<RawUTXO[]>;

  /** Get a decoded transaction by txid */
  getTransaction(txid: string): Promise<DecodedRawTransaction>;

  /** Batch-fetch multiple transactions */
  batchGetTransactions(txids: string[]): Promise<Map<string, DecodedRawTransaction>>;

  /** Broadcast a signed transaction hex, returns txid */
  sendRawTransaction(txHex: string): Promise<string>;

  /** Get current blockchain height */
  getBlockCount(): Promise<number>;

  /** Get current oracle price */
  getOraclePrice(): Promise<OraclePrice>;

  /** Get all oracle prices */
  getAllOraclePrices(blocks?: number): Promise<AllOraclePrices>;

  /** List DD positions */
  listPositions(activeOnly?: boolean): Promise<DDPosition[]>;

  /** Get DD balance */
  getBalance(address?: string): Promise<DDBalance>;

  /** Get DD system stats */
  getStats(): Promise<DDStats>;

  /** Get redemption info for a position */
  getRedemptionInfo(positionId: string, ddAmountCents?: number): Promise<RedemptionInfo>;

  /** Estimate collateral for a mint */
  estimateCollateral(ddAmount: number, lockTier: number): Promise<CollateralEstimate>;
}
