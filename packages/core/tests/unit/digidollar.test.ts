import { describe, it, expect, vi } from 'vitest';
import { DigiDollar } from '../../src/digidollar.js';
import { NoSignerError } from '../../src/errors.js';
import type { Backend } from '../../src/backend/interface.js';
import type { Signer } from '../../src/signer/interface.js';

function createMockBackend(): Backend {
  return {
    listUnspent: vi.fn().mockResolvedValue([]),
    getTransaction: vi.fn(),
    batchGetTransactions: vi.fn().mockResolvedValue(new Map()),
    sendRawTransaction: vi.fn(),
    getBlockCount: vi.fn().mockResolvedValue(60000),
    getOraclePrice: vi.fn().mockResolvedValue({
      price_micro_usd: 4500,
      price_cents: '0.0045',
      price_usd: 0.0045,
      last_update_height: 59990,
      last_update_time: Math.floor(Date.now() / 1000) - 5,
      validity_blocks: 20,
      is_stale: false,
      oracle_count: 8,
      status: 'active',
      '24h_high': '0.0050',
      '24h_low': '0.0040',
      volatility: 5,
    }),
    getAllOraclePrices: vi.fn(),
    listPositions: vi.fn().mockResolvedValue([]),
    getBalance: vi.fn().mockResolvedValue({ confirmed: '100.00', unconfirmed: '0', total: '100.00' }),
    getStats: vi.fn().mockResolvedValue({ health_percentage: 250 }),
    getRedemptionInfo: vi.fn(),
    estimateCollateral: vi.fn().mockResolvedValue({ required_dgb: '10000' }),
  };
}

function createMockSigner(): Signer {
  return {
    getPublicKey: vi.fn().mockResolvedValue(new Uint8Array(32).fill(0x02)),
    sign: vi.fn().mockResolvedValue(new Uint8Array(64).fill(0xcc)),
    getScriptPubKey: vi.fn().mockResolvedValue(new Uint8Array(34)),
    getAddress: vi.fn().mockResolvedValue('dgbt1ptest'),
  };
}

describe('DigiDollar', () => {
  describe('constructor', () => {
    it('should create with custom backend', () => {
      const dd = new DigiDollar({
        network: 'testnet',
        backend: createMockBackend(),
      });
      expect(dd.backend).toBeDefined();
      expect(dd.utxos).toBeDefined();
      expect(dd.positions).toBeDefined();
      expect(dd.oracle).toBeDefined();
    });

    it('should throw when neither backend nor rpc provided', () => {
      expect(() => new DigiDollar({ network: 'testnet' })).toThrow('backend or rpc');
    });
  });

  describe('read-only methods', () => {
    it('getOraclePrice should return snapshot', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      const price = await dd.getOraclePrice();
      expect(price.priceMicroUsd).toBe(4500n);
    });

    it('getBalance should delegate to backend', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      const balance = await dd.getBalance();
      expect(balance.total).toBe('100.00');
    });

    it('getPositions should return enriched positions', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      const positions = await dd.getPositions();
      expect(positions).toHaveLength(0);
    });

    it('getStats should delegate to backend', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      const stats = await dd.getStats();
      expect(stats.health_percentage).toBe(250);
    });

    it('getBlockHeight should delegate to backend', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      const height = await dd.getBlockHeight();
      expect(height).toBe(60000);
    });

    it('getUTXOs should return classified set', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      const utxos = await dd.getUTXOs();
      expect(utxos.standard).toHaveLength(0);
      expect(utxos.ddTokens).toHaveLength(0);
      expect(utxos.ddCollateral).toHaveLength(0);
    });
  });

  describe('transaction methods', () => {
    it('should throw NoSignerError when no signer configured', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      await expect(dd.mint({ ddAmountCents: 100n, lockTier: 0 })).rejects.toThrow(NoSignerError);
      await expect(dd.transfer({ recipients: [] })).rejects.toThrow(NoSignerError);
      await expect(dd.redeem({ positionId: 'test' })).rejects.toThrow(NoSignerError);
    });

    it('getReceiveAddress should throw NoSignerError when no signer', async () => {
      const dd = new DigiDollar({ network: 'testnet', backend: createMockBackend() });
      await expect(dd.getReceiveAddress()).rejects.toThrow(NoSignerError);
    });

    it('getReceiveAddress should return address from signer', async () => {
      const dd = new DigiDollar({
        network: 'testnet',
        backend: createMockBackend(),
        signer: createMockSigner(),
      });
      const addr = await dd.getReceiveAddress();
      expect(addr).toBe('dgbt1ptest');
    });
  });
});
