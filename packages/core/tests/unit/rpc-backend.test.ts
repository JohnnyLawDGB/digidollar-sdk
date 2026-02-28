import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RpcBackend } from '../../src/backend/rpc-backend.js';
import { DigiDollarRPC } from '@digidollar/rpc-client';

// Create a mock DigiDollarRPC that is an actual instance
function createMockRPC(): DigiDollarRPC {
  // Create a real instance with a valid port to avoid URL errors
  const rpc = new DigiDollarRPC({ port: 14024, username: 'test', password: 'test' });

  // Override methods with mocks
  rpc.listUnspent = vi.fn();
  rpc.getRawTransaction = vi.fn();
  rpc.sendRawTransaction = vi.fn();
  rpc.getBlockCount = vi.fn();
  rpc.getOraclePrice = vi.fn();
  rpc.getAllOraclePrices = vi.fn();
  rpc.listPositions = vi.fn();
  rpc.getBalance = vi.fn();
  rpc.getStats = vi.fn();
  rpc.getRedemptionInfo = vi.fn();
  rpc.estimateCollateral = vi.fn();
  rpc.batch = vi.fn();

  return rpc;
}

describe('RpcBackend', () => {
  let mockRPC: DigiDollarRPC;
  let backend: RpcBackend;

  beforeEach(() => {
    mockRPC = createMockRPC();
    backend = new RpcBackend(mockRPC);
  });

  describe('listUnspent', () => {
    it('should convert DGB amounts to bigint sats', async () => {
      vi.mocked(mockRPC.listUnspent).mockResolvedValue([
        { txid: 'abc123', vout: 0, address: 'dgbt1test', scriptPubKey: '5120aabb', amount: 1.5, confirmations: 10, spendable: true, solvable: true, safe: true },
      ]);

      const utxos = await backend.listUnspent();
      expect(utxos).toHaveLength(1);
      expect(utxos[0]!.txid).toBe('abc123');
      expect(utxos[0]!.valueSats).toBe(150_000_000n); // 1.5 DGB in sats
      expect(utxos[0]!.scriptPubKey).toBe('5120aabb');
    });
  });

  describe('getTransaction', () => {
    it('should call getRawTransaction with verbose=true', async () => {
      const fakeTx = { txid: 'abc', version: 2, vin: [], vout: [] };
      vi.mocked(mockRPC.getRawTransaction).mockResolvedValue(fakeTx as any);

      const result = await backend.getTransaction('abc');
      expect(mockRPC.getRawTransaction).toHaveBeenCalledWith('abc', true);
      expect(result).toBe(fakeTx);
    });
  });

  describe('batchGetTransactions', () => {
    it('should batch-fetch transactions', async () => {
      const tx1 = { txid: 'aaa', version: 2, vin: [], vout: [] };
      const tx2 = { txid: 'bbb', version: 2, vin: [], vout: [] };
      vi.mocked(mockRPC.batch).mockResolvedValue([tx1, tx2] as any);

      const result = await backend.batchGetTransactions(['aaa', 'bbb']);
      expect(result.size).toBe(2);
      expect(result.get('aaa')).toBe(tx1);
      expect(result.get('bbb')).toBe(tx2);
    });

    it('should return empty map for empty txids', async () => {
      const result = await backend.batchGetTransactions([]);
      expect(result.size).toBe(0);
    });
  });

  describe('sendRawTransaction', () => {
    it('should broadcast and return txid', async () => {
      vi.mocked(mockRPC.sendRawTransaction).mockResolvedValue('txid123');
      const result = await backend.sendRawTransaction('hex...');
      expect(result).toBe('txid123');
    });
  });

  describe('getBlockCount', () => {
    it('should return block height', async () => {
      vi.mocked(mockRPC.getBlockCount).mockResolvedValue(12345);
      const result = await backend.getBlockCount();
      expect(result).toBe(12345);
    });
  });

  describe('getOraclePrice', () => {
    it('should delegate to rpc.getOraclePrice', async () => {
      const price = { price_micro_usd: 4500, is_stale: false } as any;
      vi.mocked(mockRPC.getOraclePrice).mockResolvedValue(price);
      const result = await backend.getOraclePrice();
      expect(result).toBe(price);
    });
  });

  describe('listPositions', () => {
    it('should pass activeOnly to rpc', async () => {
      vi.mocked(mockRPC.listPositions).mockResolvedValue([]);
      await backend.listPositions(true);
      expect(mockRPC.listPositions).toHaveBeenCalledWith({ activeOnly: true });
    });
  });
});
