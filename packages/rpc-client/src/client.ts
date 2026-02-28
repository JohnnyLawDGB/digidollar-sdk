import { Transport, type AuthConfig } from './transport.js';
import { createOracleMethods, type OracleMethods } from './methods/oracle.js';
import { createBalanceMethods, type BalanceMethods } from './methods/balance.js';
import { createTransactionMethods, type TransactionMethods } from './methods/transaction.js';
import { createPositionMethods, type PositionMethods } from './methods/position.js';
import { createWalletMethods, type WalletMethods } from './methods/wallet.js';
import { createSystemMethods, type SystemMethods } from './methods/system.js';
import { createBlockchainMethods, type BlockchainMethods } from './methods/blockchain.js';

/** Configuration for DigiDollarRPC client */
export interface DigiDollarRPCConfig {
  host?: string;
  port: number;
  username?: string;
  password?: string;
  cookiePath?: string;
  wallet?: string;
  timeout?: number;
  ssl?: boolean;
}

function resolveAuth(config: DigiDollarRPCConfig): AuthConfig {
  if (config.cookiePath) {
    return { type: 'cookie', cookiePath: config.cookiePath };
  }
  return {
    type: 'basic',
    username: config.username ?? '',
    password: config.password ?? '',
  };
}

/**
 * DigiDollar RPC client.
 *
 * All 31 DigiDollar RPC methods are available as flat async methods on this class.
 *
 * ```ts
 * const dd = new DigiDollarRPC({ port: 14024, username: 'user', password: 'pass' });
 * const price = await dd.getOraclePrice();
 * const balance = await dd.getBalance();
 * ```
 */
export class DigiDollarRPC implements
  OracleMethods,
  BalanceMethods,
  TransactionMethods,
  PositionMethods,
  WalletMethods,
  SystemMethods,
  BlockchainMethods
{
  private readonly transport: Transport;

  // Oracle methods
  declare getOraclePrice: OracleMethods['getOraclePrice'];
  declare getAllOraclePrices: OracleMethods['getAllOraclePrices'];
  declare getOracles: OracleMethods['getOracles'];
  declare listOracle: OracleMethods['listOracle'];
  declare stopOracle: OracleMethods['stopOracle'];
  declare getOraclePubkey: OracleMethods['getOraclePubkey'];
  declare sendOraclePrice: OracleMethods['sendOraclePrice'];
  declare submitOraclePrice: OracleMethods['submitOraclePrice'];
  declare startOracle: OracleMethods['startOracle'];
  declare createOracleKey: OracleMethods['createOracleKey'];
  declare setMockOraclePrice: OracleMethods['setMockOraclePrice'];
  declare getMockOraclePrice: OracleMethods['getMockOraclePrice'];
  declare enableMockOracle: OracleMethods['enableMockOracle'];
  declare simulatePriceVolatility: OracleMethods['simulatePriceVolatility'];

  // Balance methods
  declare getBalance: BalanceMethods['getBalance'];

  // Transaction methods
  declare mint: TransactionMethods['mint'];
  declare send: TransactionMethods['send'];
  declare redeem: TransactionMethods['redeem'];
  declare listTransactions: TransactionMethods['listTransactions'];

  // Position methods
  declare listPositions: PositionMethods['listPositions'];
  declare getRedemptionInfo: PositionMethods['getRedemptionInfo'];
  declare calculateCollateral: PositionMethods['calculateCollateral'];
  declare estimateCollateral: PositionMethods['estimateCollateral'];

  // Wallet methods
  declare getAddress: WalletMethods['getAddress'];
  declare validateAddress: WalletMethods['validateAddress'];
  declare listAddresses: WalletMethods['listAddresses'];
  declare importAddress: WalletMethods['importAddress'];

  // System methods
  declare getStats: SystemMethods['getStats'];
  declare getDcaMultiplier: SystemMethods['getDcaMultiplier'];
  declare getDeploymentInfo: SystemMethods['getDeploymentInfo'];
  declare getProtectionStatus: SystemMethods['getProtectionStatus'];

  // Blockchain methods
  declare listUnspent: BlockchainMethods['listUnspent'];
  declare getRawTransaction: BlockchainMethods['getRawTransaction'];
  declare sendRawTransaction: BlockchainMethods['sendRawTransaction'];
  declare getBlockCount: BlockchainMethods['getBlockCount'];

  constructor(config: DigiDollarRPCConfig) {
    this.transport = new Transport({
      host: config.host ?? '127.0.0.1',
      port: config.port,
      auth: resolveAuth(config),
      wallet: config.wallet,
      timeout: config.timeout,
      ssl: config.ssl,
    });

    Object.assign(this, createOracleMethods(this.transport));
    Object.assign(this, createBalanceMethods(this.transport));
    Object.assign(this, createTransactionMethods(this.transport));
    Object.assign(this, createPositionMethods(this.transport));
    Object.assign(this, createWalletMethods(this.transport));
    Object.assign(this, createSystemMethods(this.transport));
    Object.assign(this, createBlockchainMethods(this.transport));
  }

  /**
   * Raw escape hatch — call any RPC method by name.
   * Use this for methods not yet covered by the typed API.
   */
  call<T = unknown>(method: string, params: unknown[] = [], useWallet = false): Promise<T> {
    return this.transport.call<T>(method, params, useWallet);
  }

  /**
   * JSON-RPC batch call — multiple methods in a single HTTP request.
   * Returns results in the same order as the input calls.
   */
  batch<T extends unknown[]>(
    calls: Array<{ method: string; params?: unknown[]; useWallet?: boolean }>,
  ): Promise<T> {
    return this.transport.batch<T>(calls);
  }

  /** Re-read cookie auth file (useful for long-running processes) */
  refreshAuth(): void {
    this.transport.refreshAuth();
  }
}
