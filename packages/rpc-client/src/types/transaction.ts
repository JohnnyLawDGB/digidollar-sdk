import type { TxCategory } from './common.js';

/** Response from mintdigidollar */
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

/** Response from senddigidollar */
export interface SendResult {
  txid: string;
  to_address: string;
  amount: string;
  status: string;
  fee_paid: string;
  inputs_used: number;
  change_amount: string;
}

/** Response from redeemdigidollar */
export interface RedeemResult {
  txid: string;
  position_id: string;
  dd_redeemed: string;
  dgb_unlocked: string;
  unlock_address: string;
  fee_paid: string;
  redemption_path: string;
  position_closed: boolean;
}

/** Single entry from listdigidollartxs */
export interface DDTransaction {
  txid: string;
  category: TxCategory;
  amount: string;
  address: string;
  confirmations: number;
  blockheight?: number;
  blockhash?: string;
  time: number;
  fee: string;
  comment?: string;
  abandoned: boolean;
  lock_tier?: number;
}
