import { DigiDollarRPC, type DigiDollarRPCConfig } from '@digidollar/rpc-client';
import type {
  OraclePrice, AllOraclePrices, DDBalance, DDPosition,
  RedemptionInfo, CollateralEstimate, DDStats, DecodedRawTransaction,
} from '@digidollar/rpc-client';
import { dgbToSats } from '@digidollar/tx-parser';
import type { Backend, RawUTXO } from './interface.js';

/**
 * RPC-backed implementation of the Backend interface.
 * Wraps DigiDollarRPC and normalizes amounts to bigint sats.
 */
export class RpcBackend implements Backend {
  readonly rpc: DigiDollarRPC;

  constructor(rpcOrConfig: DigiDollarRPC | DigiDollarRPCConfig) {
    this.rpc = rpcOrConfig instanceof DigiDollarRPC
      ? rpcOrConfig
      : new DigiDollarRPC(rpcOrConfig);
  }

  async listUnspent(minconf?: number, maxconf?: number, addresses?: string[]): Promise<RawUTXO[]> {
    const entries = await this.rpc.listUnspent(minconf, maxconf, addresses);
    return entries.map(e => ({
      txid: e.txid,
      vout: e.vout,
      address: e.address,
      scriptPubKey: e.scriptPubKey,
      valueSats: dgbToSats(e.amount),
      confirmations: e.confirmations,
    }));
  }

  async getTransaction(txid: string): Promise<DecodedRawTransaction> {
    const result = await this.rpc.getRawTransaction(txid, true);
    return result as DecodedRawTransaction;
  }

  async batchGetTransactions(txids: string[]): Promise<Map<string, DecodedRawTransaction>> {
    if (txids.length === 0) return new Map();

    const calls = txids.map(txid => ({
      method: 'getrawtransaction',
      params: [txid, true] as unknown[],
    }));

    const results = await this.rpc.batch<DecodedRawTransaction[]>(calls);
    const map = new Map<string, DecodedRawTransaction>();
    for (let i = 0; i < txids.length; i++) {
      const txid = txids[i]!;
      const result = results[i]!;
      map.set(txid, result);
    }
    return map;
  }

  async sendRawTransaction(txHex: string): Promise<string> {
    return this.rpc.sendRawTransaction(txHex);
  }

  async getBlockCount(): Promise<number> {
    return this.rpc.getBlockCount();
  }

  async getOraclePrice(): Promise<OraclePrice> {
    return this.rpc.getOraclePrice();
  }

  async getAllOraclePrices(blocks?: number): Promise<AllOraclePrices> {
    return this.rpc.getAllOraclePrices(blocks);
  }

  async listPositions(activeOnly?: boolean): Promise<DDPosition[]> {
    return this.rpc.listPositions({ activeOnly });
  }

  async getBalance(address?: string): Promise<DDBalance> {
    return this.rpc.getBalance(address ? { address } : undefined);
  }

  async getStats(): Promise<DDStats> {
    return this.rpc.getStats();
  }

  async getRedemptionInfo(positionId: string, ddAmountCents?: number): Promise<RedemptionInfo> {
    return this.rpc.getRedemptionInfo(positionId, ddAmountCents);
  }

  async estimateCollateral(ddAmount: number, lockTier: number): Promise<CollateralEstimate> {
    return this.rpc.estimateCollateral({ ddAmount, lockTier: lockTier as import('@digidollar/rpc-client').LockTier });
  }
}
