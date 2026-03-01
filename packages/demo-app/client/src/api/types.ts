// RPC response types — these match the raw JSON-RPC responses from DigiByte Core

export interface OraclePrice {
  price_usd: string;
  price_micro_usd: number;
  oracle_count?: number;
  is_stale?: boolean;
  price_age_secs?: number;
  status?: string;
}

export interface DDStats {
  health_percentage: number;
  health_status: string;
  total_collateral_dgb: number;
  total_dd_supply: number;
  oracle_price_cents: number;
  oracle_price_micro_usd: number;
  is_emergency: boolean;
  system_collateral_ratio: number;
  active_positions: number;
}

export interface DDBalance {
  confirmed: number;
  pending: number;
  total: number;
}

export interface StatusResponse {
  oracle: OraclePrice;
  height: number;
  stats: DDStats;
  balance: DDBalance;
}

export interface BalanceResponse {
  dd: DDBalance;
  dgb: number;
}

export interface Position {
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
  created_date?: string;
  unlock_date?: string;
}

export interface PositionsResponse {
  positions: Position[];
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
  dd_minted: string;
  dgb_collateral: string;
  lock_tier: number;
  unlock_height: number;
  collateral_ratio: number;
  fee_paid: string;
  position_id: string;
}

export interface TransferResult {
  txid: string;
  to_address: string;
  amount: number;
  status: string;
  fee_paid: string;
  change_amount: number;
}

export interface RedeemResult {
  txid: string;
  position_id?: string;
  dd_redeemed?: string;
  dgb_returned?: string;
  fee_paid?: string;
}
