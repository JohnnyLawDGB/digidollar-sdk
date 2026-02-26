import type { DeploymentStatus, HealthStatus } from './common.js';

/** DCA tier info within stats */
export interface DcaTierInfo {
  min_collateral: number;
  max_collateral: number;
  multiplier: number;
  status: string;
}

/** ERR tier info within stats */
export interface ErrTierInfo {
  ratio: number;
  burn_multiplier: number;
  description: string;
}

/** Response from getdigidollarstats */
export interface DDStats {
  health_percentage: number;
  health_status: HealthStatus;
  total_collateral_dgb: number;
  total_dd_supply: number;
  oracle_price_cents: number;
  oracle_price_micro_usd: number;
  is_emergency: boolean;
  system_collateral_ratio: number;
  total_collateral_locked: number;
  active_positions: number;
  oracle_price_age: number;
  dca_tier: DcaTierInfo;
  err_tier: ErrTierInfo;
}

/** Response from getdcamultiplier */
export interface DcaMultiplier {
  multiplier: number;
  system_health: number;
  tier_status: string;
  description: string;
}

/** Response from getdigidollardeploymentinfo */
export interface DeploymentInfo {
  enabled: boolean;
  status: DeploymentStatus;
  bit: number;
  start_time: number;
  timeout: number;
  min_activation_height: number;
  activation_height?: number;
  blocks_until_timeout?: number;
  signaling_blocks?: number;
  threshold?: number;
  period_blocks?: number;
  progress_percent?: number;
}

/** DCA protection status */
export interface DcaProtection {
  active: boolean;
  current_multiplier: number;
  tier: string;
  system_health: number;
  trend: string;
}

/** ERR protection status */
export interface ErrProtection {
  active: boolean;
  threshold: number;
  current_ratio: number;
  status: string;
}

/** Volatility protection status */
export interface VolatilityProtection {
  protection_active: boolean;
  current_volatility: number;
  protection_threshold: number;
  minting_restricted: boolean;
}

/** Overall protection summary */
export interface OverallProtection {
  status: string;
  active_protections: string[];
  warnings: string[];
}

/** Response from getprotectionstatus */
export interface ProtectionStatus {
  dca: DcaProtection;
  err: ErrProtection;
  volatility: VolatilityProtection;
  overall: OverallProtection;
}
