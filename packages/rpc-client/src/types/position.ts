import type { PositionStatus, RedemptionPath } from './common.js';

/** Single entry from listdigidollarpositions */
export interface DDPosition {
  position_id: string;
  dd_minted: string;
  dgb_collateral: string;
  lock_tier: number;
  lock_days: number;
  unlock_height: number;
  blocks_remaining: number;
  status: PositionStatus;
  health_ratio: number;
  can_redeem: boolean;
  created_date: string;
  unlock_date: string;
}

/** Response from getredemptioninfo */
export interface RedemptionInfo {
  position_id: string;
  can_redeem: boolean;
  redemption_path: RedemptionPath;
  total_dd_minted: string;
  redeemable_dd: string;
  dgb_return: string;
  unlock_height: number;
  timelock_remaining: number;
  penalty_amount: string;
  status: string;
  unlock_date: string;
}

/** Response from estimatecollateral */
export interface CollateralEstimate {
  required_dgb: string;
  dd_amount: string;
  lock_tier: number;
  lock_days: number;
  base_ratio: number;
  dca_multiplier: number;
  effective_ratio: number;
  oracle_price_micro_usd: number;
  oracle_price_usd: number;
  system_health: number;
  health_tier: string;
  usd_value: string;
}

/** Response from calculatecollateralrequirement */
export interface CollateralRequirement {
  required_dgb: number;
  dd_amount_cents: number;
  dd_amount_usd: number;
  lock_days: number;
  lock_blocks: number;
  base_ratio: number;
  dca_multiplier: number;
  effective_ratio: number;
  oracle_price_micro_usd: number;
  oracle_price_usd: number;
  system_health: number;
  dca_tier: string;
}
