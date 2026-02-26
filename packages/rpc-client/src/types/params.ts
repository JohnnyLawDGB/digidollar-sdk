import type { LockTier, TxCategory } from './common.js';

/** Parameters for mintdigidollar */
export interface MintParams {
  ddAmountCents: number;
  lockTier: LockTier;
  feeRate?: number;
}

/** Parameters for senddigidollar */
export interface SendParams {
  address: string;
  amountCents: number;
  comment?: string;
  feeRate?: number;
}

/** Parameters for redeemdigidollar */
export interface RedeemParams {
  positionId: string;
  ddAmountCents: number;
  redemptionAddress?: string;
  feeRate?: number;
}

/** Parameters for listdigidollarpositions */
export interface ListPositionsParams {
  activeOnly?: boolean;
  tierFilter?: LockTier;
  minAmount?: number;
}

/** Parameters for getdigidollarbalance */
export interface GetBalanceParams {
  address?: string;
  minconf?: number;
  includeWatchonly?: boolean;
}

/** Parameters for listdigidollaraddresses */
export interface ListAddressesParams {
  includeWatchonly?: boolean;
  minBalance?: number;
}

/** Parameters for importdigidollaraddress */
export interface ImportAddressParams {
  address: string;
  label?: string;
  rescan?: boolean;
  p2sh?: boolean;
}

/** Parameters for listdigidollartxs */
export interface ListTransactionsParams {
  count?: number;
  skip?: number;
  address?: string;
  category?: TxCategory;
}

/** Parameters for calculatecollateralrequirement */
export interface CalculateCollateralParams {
  ddAmountCents: number;
  lockDays: number;
  oraclePrice?: number;
}

/** Parameters for estimatecollateral */
export interface EstimateCollateralParams {
  ddAmount: number;
  lockTier: LockTier;
  oraclePriceMicroUsd?: number;
}
