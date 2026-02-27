/** Parsed DD MINT OP_RETURN data */
export interface DDMintOpReturn {
  txType: 'mint';
  /** DD amount in cents */
  ddAmountCents: bigint;
  /** Absolute lock height (block number) */
  lockHeight: bigint;
  /** Lock tier (0-9) */
  lockTier: bigint;
  /** Owner's x-only public key (32 bytes) */
  ownerPubKey: Uint8Array;
}

/** Parsed DD TRANSFER OP_RETURN data */
export interface DDTransferOpReturn {
  txType: 'transfer';
  /** DD amounts in cents, one per zero-value P2TR output */
  amounts: bigint[];
}

/** Parsed DD REDEEM OP_RETURN data */
export interface DDRedeemOpReturn {
  txType: 'redeem';
  /** DD amount in cents being redeemed */
  ddAmountCents: bigint;
}

/** Discriminated union of all DD OP_RETURN types */
export type DDOpReturnData = DDMintOpReturn | DDTransferOpReturn | DDRedeemOpReturn;
