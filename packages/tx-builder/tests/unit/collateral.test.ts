import { describe, it, expect } from 'vitest';
import { calculateCollateral, getCollateralRatio, lockTierToBlocks } from '../../src/collateral.js';

describe('calculateCollateral', () => {
  it('matches C++ formula: $100 DD at $0.00631 with 500% ratio', () => {
    // $100 DD = 10,000 cents, $0.00631 = 6,310 micro-USD, 500% ratio
    // numerator = 10,000 * 100,000,000 * 500 * 100 = 50,000,000,000,000,000
    // result = 50,000,000,000,000,000 / 6,310 = 7,924,009,508,716 sats ≈ 79,240 DGB
    const result = calculateCollateral(10_000n, 6_310n, 500);
    expect(result).toBe(50_000_000_000_000_000n / 6_310n);
  });

  it('handles tier 0 (1000% ratio)', () => {
    // $1 DD = 100 cents at $0.01 DGB = 10,000 micro-USD, 1000% ratio
    // numerator = 100 * 100,000,000 * 1000 * 100 = 1,000,000,000,000,000
    // result = 1,000,000,000,000,000 / 10,000 = 100,000,000,000 sats = 1,000 DGB
    const result = calculateCollateral(100n, 10_000n, 1000);
    expect(result).toBe(100_000_000_000n);
  });

  it('rejects zero DD amount', () => {
    expect(() => calculateCollateral(0n, 10_000n, 500)).toThrow('DD amount must be positive');
  });

  it('rejects zero oracle price', () => {
    expect(() => calculateCollateral(100n, 0n, 500)).toThrow('Oracle price must be positive');
  });

  it('rejects negative values', () => {
    expect(() => calculateCollateral(-100n, 10_000n, 500)).toThrow();
    expect(() => calculateCollateral(100n, -10_000n, 500)).toThrow();
  });

  it('uses bigint to prevent overflow', () => {
    // Large values that would overflow uint64 in naive multiplication
    // $10,000 DD at $0.001 with 1000% ratio
    const result = calculateCollateral(1_000_000n, 1_000n, 1000);
    expect(result).toBe(10_000_000_000_000_000n);
  });
});

describe('getCollateralRatio', () => {
  it('returns 1000 for tier 0', () => {
    expect(getCollateralRatio(0)).toBe(1000);
  });

  it('returns 500 for tier 1', () => {
    expect(getCollateralRatio(1)).toBe(500);
  });

  it('returns 200 for tier 9', () => {
    expect(getCollateralRatio(9)).toBe(200);
  });

  it('rejects invalid tiers', () => {
    expect(() => getCollateralRatio(-1)).toThrow();
    expect(() => getCollateralRatio(10)).toThrow();
  });
});

describe('lockTierToBlocks', () => {
  it('returns 240 for tier 0', () => {
    expect(lockTierToBlocks(0)).toBe(240);
  });

  it('returns 172800 for tier 1 (30 days)', () => {
    expect(lockTierToBlocks(1)).toBe(172_800);
  });

  it('returns 21024000 for tier 9 (10 years)', () => {
    expect(lockTierToBlocks(9)).toBe(21_024_000);
  });

  it('rejects invalid tiers', () => {
    expect(() => lockTierToBlocks(-1)).toThrow();
    expect(() => lockTierToBlocks(10)).toThrow();
  });
});
