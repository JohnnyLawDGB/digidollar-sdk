import type { DigiDollarRPCConfig } from '@digidollar/rpc-client';
import type { Backend } from './backend/interface.js';
import type { Signer } from './signer/interface.js';

/** Network identifiers */
export type Network = 'mainnet' | 'testnet' | 'regtest';

/** Configuration for DigiDollar SDK */
export interface DigiDollarConfig {
  /** Network (determines address HRP and derivation path coin type) */
  network: Network;

  /**
   * Backend for chain data access.
   * If omitted, an RpcBackend is created from `rpc` config.
   */
  backend?: Backend;

  /** RPC connection config (used if no custom backend is provided) */
  rpc?: DigiDollarRPCConfig;

  /** Signer for transaction signing. Required for mint/transfer/redeem. */
  signer?: Signer;

  /** Default fee rate in sat/vB. Defaults to 1000. */
  defaultFeeRate?: bigint;
}

/** Resolved defaults for DigiDollarConfig */
export const DEFAULT_FEE_RATE = 1000n;
