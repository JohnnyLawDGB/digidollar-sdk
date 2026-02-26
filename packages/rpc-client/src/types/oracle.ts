import type { OraclePriceSource, OracleStatus } from './common.js';

/** Response from getoracleprice */
export interface OraclePrice {
  price_micro_usd: number;
  price_cents: string;
  price_usd: number;
  last_update_height: number;
  last_update_time: number;
  validity_blocks: number;
  is_stale: boolean;
  oracle_count: number;
  status: string;
  '24h_high': string;
  '24h_low': string;
  volatility: number;
}

/** Single oracle entry in getalloracleprices response */
export interface OracleEntry {
  oracle_id: number;
  name: string;
  endpoint: string;
  price_micro_usd: number;
  price_usd: number;
  timestamp: number;
  block_height: number;
  deviation_pct: number;
  signature_valid: boolean;
  status: string;
}

/** Response from getalloracleprices */
export interface AllOraclePrices {
  block_height: number;
  consensus_price_micro_usd: number;
  consensus_price_usd: number;
  oracle_count: number;
  required: number;
  total_oracles: number;
  oracles: OracleEntry[];
  last_bundle_height: number;
  last_bundle_time: number;
}

/** Single oracle in getoracles response */
export interface OracleInfo {
  oracle_id: number;
  name: string;
  pubkey: string;
  endpoint: string;
  is_active: boolean;
  last_price_micro_usd: number;
  last_price_usd: number;
  last_update: number;
  price_source: OraclePriceSource;
  status: OracleStatus;
  selected_for_epoch: boolean;
  is_running_locally: boolean;
}

/** Response from listoracle */
export interface LocalOracleInfo {
  running: boolean;
  oracle_id?: number;
  name?: string;
  pubkey?: string;
  price_micro_usd?: number;
  price_usd?: number;
  last_update?: number;
  price_source?: OraclePriceSource;
  enabled?: boolean;
  message?: string;
}

/** Response from getoraclepubkey */
export interface OraclePubkey {
  oracle_id: number;
  pubkey: string;
  pubkey_full: string;
  valid: boolean;
  authorized: boolean;
  is_running: boolean;
}

/** Response from sendoracleprice */
export interface SendOraclePriceResult {
  hash: string;
  oracle_id: number;
  price_micro_usd: number;
  price_usd: number;
  timestamp: number;
  broadcasted: boolean;
}

/** Response from submitoracleprice */
export interface SubmitOraclePriceResult {
  oracle_id: number;
  price_micro_usd: number;
  accepted: boolean;
  pending_count: number;
  min_required: number;
}

/** Response from stoporacle */
export interface StopOracleResult {
  success: boolean;
  oracle_id: number;
  status: string;
  message: string;
  was_running: boolean;
}

/** Response from startoracle */
export interface StartOracleResult {
  success: boolean;
  oracle_id: number;
  status: string;
  message: string;
  was_already_running: boolean;
  warning?: string;
}

/** Response from createoraclekey */
export interface CreateOracleKeyResult {
  oracle_id: number;
  pubkey: string;
  pubkey_xonly: string;
  stored_in_wallet: boolean;
  message: string;
}

/** Response from setmockoracleprice */
export interface MockOraclePriceResult {
  price_micro_usd: number;
  price_usd: string;
  update_height: number;
  enabled: boolean;
}

/** Response from getmockoracleprice */
export interface GetMockOraclePriceResult {
  price_micro_usd: number;
  price_usd: string;
  last_update_height: number;
  enabled: boolean;
  current_height: number;
}

/** Response from simulatepricevolatility */
export interface SimulatePriceVolatilityResult {
  old_price: number;
  new_price: number;
  percent_change: number;
  update_height: number;
}

/** Response from enablemockoracle */
export interface EnableMockOracleResult {
  enabled: boolean;
  current_price: number;
  current_height: number;
}
