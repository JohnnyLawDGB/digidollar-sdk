// Builders
export { MintBuilder } from './builders/mint.js';
export { TransferBuilder } from './builders/transfer.js';
export { RedeemBuilder } from './builders/redeem.js';

// Taproot
export { buildCollateralMAST, buildTokenP2TR } from './taproot/mast.js';
export { buildNormalLeaf, buildERRLeaf } from './taproot/leaf-scripts.js';
export { tweakPublicKey } from './taproot/tweak.js';
export { taggedHash, tapleafHash, tapbranchHash, tapTweakHash } from './taproot/tagged-hash.js';

// OP_RETURN encoding
export { encodeMintOpReturn, encodeTransferOpReturn, encodeRedeemOpReturn } from './op-return-encode.js';

// Collateral
export { calculateCollateral, getCollateralRatio, lockTierToBlocks } from './collateral.js';

// Coin selection
export { selectCoins } from './coin-select.js';
export type { CoinSelection } from './coin-select.js';

// Fee estimation
export { estimateVsize, calculateFee } from './fee.js';

// Transaction serialization
export { serializeTransaction, serializeForTxid, computeTxid } from './tx/serialize.js';

// Script builder
export { pushData, pushNum, opcode } from './tx/script-builder.js';

// Varint
export { encodeVarint } from './tx/varint.js';

// Signing (optional)
export { signSchnorr, verifySchnorr } from './sign.js';

// Constants
export {
  NUMS_POINT, TAPSCRIPT_LEAF_VERSION, LOCK_TIERS, BLOCKS_PER_DAY,
  DUST_THRESHOLD, MIN_FEE_RATE, MAX_FEE_RATE, MIN_DD_FEE, MIN_REDEEM_FEE,
  WITNESS_PER_INPUT, FEE_SAFETY_MARGIN, MAX_TX_INPUTS, MAX_MONEY, COIN,
  DD_VERSION_MINT, DD_VERSION_TRANSFER, DD_VERSION_REDEEM,
  OP_CHECKLOCKTIMEVERIFY, OP_DROP, OP_CHECKSIG, OP_LESSTHAN, OP_VERIFY,
  OP_DIGIDOLLAR, OP_DDVERIFY, OP_CHECKCOLLATERAL,
  OP_0, OP_1, OP_RETURN, OP_PUSHDATA1, OP_PUSHDATA2, OP_PUSHDATA4,
  SEQUENCE_CLTV_ENABLED, SEQUENCE_FINAL,
} from './constants.js';
export type { LockTierEntry } from './constants.js';

// Errors
export {
  TxBuilderError, InsufficientCollateralError, InsufficientFeeError,
  InsufficientDDError, InvalidParamsError, CoinSelectionError,
} from './errors.js';

// Types
export type {
  UTXO, DDTokenUTXO, MintParams, TransferRecipient, TransferParams,
  RedeemParams, TxInput, TxOutput, UnsignedTx, BuilderResult,
  CollateralSpendData,
} from './types.js';
