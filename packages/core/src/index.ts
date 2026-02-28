// Main facade
export { DigiDollar } from './digidollar.js';

// Config
export { type DigiDollarConfig, type Network, DEFAULT_FEE_RATE } from './config.js';

// Backend
export { type Backend, type RawUTXO } from './backend/interface.js';
export { RpcBackend } from './backend/rpc-backend.js';

// Signer
export { type Signer, type SigningContext } from './signer/interface.js';
export { BIP86Signer } from './signer/bip86-signer.js';
export { encodeBech32m, decodeBech32m, getHRP } from './signer/address.js';

// UTXO
export { UTXOManager } from './utxo/manager.js';
export { type ClassifiedUTXOSet } from './utxo/types.js';

// Position
export { PositionTracker } from './position/tracker.js';
export { type EnrichedPosition, type PositionHealth } from './position/types.js';

// Oracle
export { OracleWrapper, type OracleSnapshot } from './oracle/wrapper.js';

// Pipeline types
export {
  type MintRequest, type MintResult,
  type TransferRequest, type TransferResult, type TransferRecipientReq,
  type RedeemRequest, type RedeemResult,
} from './pipeline/types.js';

// Pipeline internals (for advanced usage)
export { computeTaprootSighash, type PrevoutData, type SighashOptions } from './pipeline/sighash.js';
export { buildKeyPathWitness, buildScriptPathWitness, injectWitness } from './pipeline/witness.js';

// Errors
export {
  CoreError, NoSignerError, StalePriceError,
  InsufficientFundsError, InsufficientDDError,
  PositionError, AddressError, BackendError,
} from './errors.js';
