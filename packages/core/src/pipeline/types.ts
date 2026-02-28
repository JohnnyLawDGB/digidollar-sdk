/** Request to mint DigiDollars */
export interface MintRequest {
  /** DD amount to mint in cents (100 = $1.00) */
  ddAmountCents: bigint;
  /** Lock tier (0-9) */
  lockTier: number;
  /** Fee rate in sat/vB (uses default if omitted) */
  feeRate?: bigint;
}

/** Result of a successful mint */
export interface MintResult {
  /** Transaction ID */
  txid: string;
  /** DD amount minted in cents */
  ddMintedCents: bigint;
  /** Collateral locked in sats */
  collateralSats: bigint;
  /** Fee paid in sats */
  feeSats: bigint;
  /** Block height when position unlocks */
  unlockHeight: number;
  /** Signed transaction hex for inspection */
  rawTx: string;
}

/** A single transfer recipient */
export interface TransferRecipientReq {
  /** Recipient's bech32m address */
  toAddress: string;
  /** DD amount in cents */
  ddAmountCents: bigint;
}

/** Request to transfer DigiDollars */
export interface TransferRequest {
  /** Recipients */
  recipients: TransferRecipientReq[];
  /** Fee rate in sat/vB (uses default if omitted) */
  feeRate?: bigint;
}

/** Result of a successful transfer */
export interface TransferResult {
  /** Transaction ID */
  txid: string;
  /** Recipient addresses and amounts */
  recipients: TransferRecipientReq[];
  /** Fee paid in sats */
  feeSats: bigint;
  /** DD change returned to sender (cents) */
  ddChangeCents: bigint;
  /** Signed transaction hex */
  rawTx: string;
}

/** Request to redeem (burn) DigiDollars and unlock collateral */
export interface RedeemRequest {
  /** Position ID (mint txid) */
  positionId: string;
  /** DD amount in cents to redeem (defaults to full position amount) */
  ddAmountCents?: bigint;
  /** Fee rate in sat/vB (uses default if omitted) */
  feeRate?: bigint;
}

/** Result of a successful redeem */
export interface RedeemResult {
  /** Transaction ID */
  txid: string;
  /** Position ID that was redeemed */
  positionId: string;
  /** DD burned in cents */
  ddRedeemedCents: bigint;
  /** DGB returned to owner in sats */
  dgbReturnedSats: bigint;
  /** Fee paid in sats */
  feeSats: bigint;
  /** Whether the full position was closed */
  positionClosed: boolean;
  /** Signed transaction hex */
  rawTx: string;
}
