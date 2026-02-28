/** A spendable UTXO */
export interface UTXO {
  /** Transaction ID (hex, 64 chars) */
  txid: string;
  /** Output index */
  vout: number;
  /** Value in satoshis */
  value: bigint;
  /** scriptPubKey hex */
  scriptPubKey: string;
}

/** A DD token UTXO with its DD amount */
export interface DDTokenUTXO extends UTXO {
  /** DD amount in cents held by this UTXO */
  ddAmountCents: bigint;
}

/** Parameters for building a mint transaction */
export interface MintParams {
  /** DD amount to mint in cents (100 = $1.00) */
  ddAmountCents: bigint;
  /** Lock tier (0-9) */
  lockTier: number;
  /** Owner's x-only public key (32 bytes) */
  ownerPubKey: Uint8Array;
  /** Current oracle price in micro-USD (1,000,000 = $1.00 DGB) */
  oraclePriceMicroUsd: bigint;
  /** Current blockchain height */
  currentHeight: number;
  /** Available UTXOs for collateral + fees */
  utxos: UTXO[];
  /** Fee rate in sat/vB */
  feeRate: bigint;
  /** Change destination scriptPubKey (hex) */
  changeDest: string;
}

/** A transfer recipient */
export interface TransferRecipient {
  /** Recipient's x-only public key (32 bytes) */
  recipientPubKey: Uint8Array;
  /** DD amount in cents */
  ddAmountCents: bigint;
}

/** Parameters for building a transfer transaction */
export interface TransferParams {
  /** Recipients with DD amounts */
  recipients: TransferRecipient[];
  /** DD token UTXOs to spend */
  ddUtxos: DDTokenUTXO[];
  /** DGB UTXOs for fee payment */
  feeUtxos: UTXO[];
  /** Spender's x-only public key (32 bytes) for DD change output */
  spenderPubKey: Uint8Array;
  /** Fee rate in sat/vB */
  feeRate: bigint;
  /** DGB fee change destination scriptPubKey (hex) */
  changeDest: string;
}

/** Parameters for building a redeem transaction */
export interface RedeemParams {
  /** Collateral UTXO to unlock */
  collateralUtxo: UTXO;
  /** DD amount in cents to redeem/burn */
  ddToRedeemCents: bigint;
  /** DD token UTXOs to burn */
  ddUtxos: DDTokenUTXO[];
  /** DGB UTXOs for fee payment */
  feeUtxos: UTXO[];
  /** Owner's x-only public key (32 bytes) */
  ownerPubKey: Uint8Array;
  /** Current blockchain height */
  currentHeight: number;
  /** Position unlock height (from mint lockHeight) */
  unlockHeight: number;
  /** Total collateral amount locked in the position (sats) */
  collateralAmount: bigint;
  /** Fee rate in sat/vB */
  feeRate: bigint;
  /** Destination for returned collateral (scriptPubKey hex) */
  collateralDest: string;
  /** Destination for DGB fee change (scriptPubKey hex) */
  changeDest: string;
}

/** A transaction input */
export interface TxInput {
  txid: string;
  vout: number;
  scriptSig: Uint8Array;
  sequence: number;
  witness: Uint8Array[];
}

/** A transaction output */
export interface TxOutput {
  value: bigint;
  scriptPubKey: Uint8Array;
}

/** An unsigned transaction ready for serialization */
export interface UnsignedTx {
  version: number;
  inputs: TxInput[];
  outputs: TxOutput[];
  locktime: number;
}

/** Result from a builder */
export interface BuilderResult {
  /** Serialized unsigned transaction bytes */
  tx: Uint8Array;
  /** Transaction ID (double-SHA256 of non-witness serialization, little-endian hex) */
  txid: string;
  /** Total fee in sats */
  fee: bigint;
  /** The unsigned transaction structure (for signing) */
  unsignedTx: UnsignedTx;
}

/** Taproot spend data for a collateral output */
export interface CollateralSpendData {
  /** The P2TR scriptPubKey (OP_1 <32-byte output key>) */
  scriptPubKey: Uint8Array;
  /** The tweaked output key (32 bytes x-only) */
  outputKey: Uint8Array;
  /** Output key parity (0 or 1) */
  parity: number;
  /** Merkle root of the MAST tree (32 bytes) */
  merkleRoot: Uint8Array;
  /** Normal leaf script bytes */
  normalLeaf: Uint8Array;
  /** ERR leaf script bytes */
  errLeaf: Uint8Array;
  /** Normal leaf hash */
  normalLeafHash: Uint8Array;
  /** ERR leaf hash */
  errLeafHash: Uint8Array;
}
