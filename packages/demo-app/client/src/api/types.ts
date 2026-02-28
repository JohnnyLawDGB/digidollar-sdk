export interface OracleSnapshot {
  priceMicroUsd: bigint;
  isStale: boolean;
  priceAgeSecs: number;
  oracleCount: number;
  status: string;
}

export interface DDStats {
  health_percentage: number;
  health_status: 'healthy' | 'warning' | 'critical' | 'emergency';
  total_collateral_dgb: number;
  total_dd_supply: number;
  oracle_price_cents: number;
  oracle_price_micro_usd: number;
  is_emergency: boolean;
  system_collateral_ratio: number;
  active_positions: number;
}

export interface DDBalance {
  confirmed: string;
  unconfirmed: string;
  total: string;
}

export interface StatusResponse {
  oracle: OracleSnapshot;
  height: number;
  stats: DDStats;
  balance: DDBalance;
}

export interface BalanceResponse {
  dd: DDBalance;
  dgbBalance: bigint;
  ddBalance: bigint;
}

export interface EnrichedPosition {
  position_id: string;
  dd_minted: string;
  dgb_collateral: string;
  lock_tier: number;
  lock_days: number;
  unlock_height: number;
  blocks_remaining: number;
  status: string;
  health_ratio: number;
  can_redeem: boolean;
  created_date: string;
  unlock_date: string;
  blocksUntilUnlock: number;
  secondsUntilUnlock: number;
  canRedeemNow: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical';
  effectiveRatio: number;
}

export interface PositionsResponse {
  positions: EnrichedPosition[];
}

export interface AddressResponse {
  address: string;
}

export interface CollateralEstimate {
  required_dgb: string;
  dd_amount: string;
  lock_tier: number;
  lock_days: number;
  base_ratio: number;
  effective_ratio: number;
  oracle_price_micro_usd: number;
  oracle_price_usd: number;
  usd_value: string;
}

export interface MintResult {
  txid: string;
  ddMintedCents: bigint;
  collateralSats: bigint;
  feeSats: bigint;
  unlockHeight: number;
}

export interface TransferResult {
  txid: string;
  feeSats: bigint;
  ddChangeCents: bigint;
}

export interface RedeemResult {
  txid: string;
  positionId: string;
  ddRedeemedCents: bigint;
  dgbReturnedSats: bigint;
  feeSats: bigint;
  positionClosed: boolean;
}
