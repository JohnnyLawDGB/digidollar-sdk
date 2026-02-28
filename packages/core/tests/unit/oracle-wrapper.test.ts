import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OracleWrapper } from '../../src/oracle/wrapper.js';
import type { Backend } from '../../src/backend/interface.js';
import { StalePriceError } from '../../src/errors.js';
import { COIN } from '@digidollar/tx-builder';

function createMockBackend(): Backend {
  return {
    listUnspent: vi.fn(),
    getTransaction: vi.fn(),
    batchGetTransactions: vi.fn(),
    sendRawTransaction: vi.fn(),
    getBlockCount: vi.fn(),
    getOraclePrice: vi.fn(),
    getAllOraclePrices: vi.fn(),
    listPositions: vi.fn(),
    getBalance: vi.fn(),
    getStats: vi.fn(),
    getRedemptionInfo: vi.fn(),
    estimateCollateral: vi.fn(),
  };
}

describe('OracleWrapper', () => {
  let mockBackend: Backend;
  let oracle: OracleWrapper;

  beforeEach(() => {
    mockBackend = createMockBackend();
    oracle = new OracleWrapper(mockBackend);
  });

  describe('getPrice', () => {
    it('should return oracle snapshot with computed fields', async () => {
      vi.mocked(mockBackend.getOraclePrice).mockResolvedValue({
        price_micro_usd: 4500,
        price_cents: '0.0045',
        price_usd: 0.0045,
        last_update_height: 60000,
        last_update_time: Math.floor(Date.now() / 1000) - 30,
        validity_blocks: 20,
        is_stale: false,
        oracle_count: 8,
        status: 'active',
        '24h_high': '0.0050',
        '24h_low': '0.0040',
        volatility: 5,
      });

      const snapshot = await oracle.getPrice();
      expect(snapshot.priceMicroUsd).toBe(4500n);
      expect(snapshot.isStale).toBe(false);
      expect(snapshot.priceAgeSecs).toBeGreaterThanOrEqual(29);
      expect(snapshot.priceAgeSecs).toBeLessThan(35);
      expect(snapshot.oracleCount).toBe(8);
    });
  });

  describe('requireFreshPrice', () => {
    it('should return snapshot when price is fresh', async () => {
      vi.mocked(mockBackend.getOraclePrice).mockResolvedValue({
        price_micro_usd: 4500,
        price_cents: '0.0045',
        price_usd: 0.0045,
        last_update_height: 60000,
        last_update_time: Math.floor(Date.now() / 1000) - 10,
        validity_blocks: 20,
        is_stale: false,
        oracle_count: 8,
        status: 'active',
        '24h_high': '0.0050',
        '24h_low': '0.0040',
        volatility: 5,
      });

      const snapshot = await oracle.requireFreshPrice();
      expect(snapshot.priceMicroUsd).toBe(4500n);
    });

    it('should throw StalePriceError when stale', async () => {
      vi.mocked(mockBackend.getOraclePrice).mockResolvedValue({
        price_micro_usd: 4500,
        price_cents: '0.0045',
        price_usd: 0.0045,
        last_update_height: 59000,
        last_update_time: Math.floor(Date.now() / 1000) - 600,
        validity_blocks: 20,
        is_stale: true,
        oracle_count: 3,
        status: 'stale',
        '24h_high': '0.0050',
        '24h_low': '0.0040',
        volatility: 5,
      });

      await expect(oracle.requireFreshPrice()).rejects.toThrow(StalePriceError);
    });

    it('should throw when price is zero', async () => {
      vi.mocked(mockBackend.getOraclePrice).mockResolvedValue({
        price_micro_usd: 0,
        price_cents: '0',
        price_usd: 0,
        last_update_height: 0,
        last_update_time: 0,
        validity_blocks: 20,
        is_stale: false,
        oracle_count: 0,
        status: 'no_consensus',
        '24h_high': '0',
        '24h_low': '0',
        volatility: 0,
      });

      await expect(oracle.requireFreshPrice()).rejects.toThrow(StalePriceError);
    });
  });

  describe('ddToSats', () => {
    it('should convert DD cents to sats correctly', () => {
      // At price 4500 micro-USD/DGB ($0.0045/DGB):
      // $1.00 DD (100 cents) = 100 * COIN * 10000 / 4500
      // = 100 * 100_000_000 * 10_000 / 4500
      // = 22,222,222,222n sats (≈222.22 DGB)
      const sats = oracle.ddToSats(100n, 4500n);
      expect(sats).toBe(100n * COIN * 10_000n / 4500n);
    });

    it('should throw when price is zero', () => {
      expect(() => oracle.ddToSats(100n, 0n)).toThrow('zero');
    });
  });

  describe('satsToDDCents', () => {
    it('should convert sats to DD cents correctly', () => {
      // 100_000_000 sats (1 DGB) at 4500 micro-USD = 4500 / 10_000 = 0.45 cents
      const cents = oracle.satsToDDCents(COIN, 4500n);
      expect(cents).toBe(COIN * 4500n / (COIN * 10_000n));
    });
  });
});
