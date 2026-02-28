/**
 * DigiDollar — the main facade class.
 *
 * Wires together Backend, Signer, UTXOManager, PositionTracker, and OracleWrapper
 * into a single high-level API: dd.mint(), dd.transfer(), dd.redeem().
 */

import { DigiDollarRPC } from '@digidollar/rpc-client';
import type { DDBalance, DDStats, CollateralEstimate } from '@digidollar/rpc-client';
import type { DigiDollarConfig } from './config.js';
import type { Backend } from './backend/interface.js';
import { RpcBackend } from './backend/rpc-backend.js';
import type { Signer } from './signer/interface.js';
import { UTXOManager } from './utxo/manager.js';
import type { ClassifiedUTXOSet } from './utxo/types.js';
import { PositionTracker } from './position/tracker.js';
import type { EnrichedPosition } from './position/types.js';
import { OracleWrapper, type OracleSnapshot } from './oracle/wrapper.js';
import { executeMint } from './pipeline/mint.js';
import { executeTransfer } from './pipeline/transfer.js';
import { executeRedeem } from './pipeline/redeem.js';
import type { MintRequest, MintResult, TransferRequest, TransferResult, RedeemRequest, RedeemResult } from './pipeline/types.js';
import { NoSignerError } from './errors.js';

export class DigiDollar {
  readonly backend: Backend;
  readonly utxos: UTXOManager;
  readonly positions: PositionTracker;
  readonly oracle: OracleWrapper;
  readonly rpc?: DigiDollarRPC;

  private readonly signer?: Signer;

  constructor(config: DigiDollarConfig) {
    // Set up backend
    if (config.backend) {
      this.backend = config.backend;
    } else if (config.rpc) {
      const rpc = new DigiDollarRPC(config.rpc);
      this.rpc = rpc;
      this.backend = new RpcBackend(rpc);
    } else {
      throw new Error('Either backend or rpc config must be provided');
    }

    this.signer = config.signer;
    this.utxos = new UTXOManager(this.backend);
    this.positions = new PositionTracker(this.backend);
    this.oracle = new OracleWrapper(this.backend);
  }

  private requireSigner(): Signer {
    if (!this.signer) throw new NoSignerError();
    return this.signer;
  }

  // --- Transactions (require Signer) ---

  /** Mint DigiDollars by locking DGB as collateral */
  async mint(req: MintRequest): Promise<MintResult> {
    return executeMint(req, this.requireSigner(), this.backend, this.utxos, this.oracle);
  }

  /** Transfer DigiDollars to one or more recipients */
  async transfer(req: TransferRequest): Promise<TransferResult> {
    return executeTransfer(req, this.requireSigner(), this.backend, this.utxos);
  }

  /** Redeem (burn) DigiDollars and unlock collateral */
  async redeem(req: RedeemRequest): Promise<RedeemResult> {
    return executeRedeem(req, this.requireSigner(), this.backend, this.utxos, this.positions);
  }

  // --- Read-only ---

  /** Get current oracle price with staleness info */
  async getOraclePrice(): Promise<OracleSnapshot> {
    return this.oracle.getPrice();
  }

  /** Get DD balance for the wallet or a specific address */
  async getBalance(address?: string): Promise<DDBalance> {
    return this.backend.getBalance(address);
  }

  /** Get all positions with enrichment */
  async getPositions(activeOnly?: boolean): Promise<EnrichedPosition[]> {
    return this.positions.getPositions(activeOnly);
  }

  /** Get a single enriched position by ID */
  async getPosition(positionId: string): Promise<EnrichedPosition | null> {
    return this.positions.getPosition(positionId);
  }

  /** Get DigiDollar system stats */
  async getStats(): Promise<DDStats> {
    return this.backend.getStats();
  }

  /** Get a new receiving address from the signer */
  async getReceiveAddress(): Promise<string> {
    return this.requireSigner().getAddress();
  }

  /** Get current blockchain height */
  async getBlockHeight(): Promise<number> {
    return this.backend.getBlockCount();
  }

  /** Get classified UTXOs (standard, ddTokens, ddCollateral) */
  async getUTXOs(): Promise<ClassifiedUTXOSet> {
    return this.utxos.getClassifiedUTXOs();
  }

  /** Estimate collateral needed for a mint */
  async estimateCollateral(ddAmountCents: bigint, lockTier: number): Promise<CollateralEstimate> {
    return this.backend.estimateCollateral(Number(ddAmountCents), lockTier);
  }
}
