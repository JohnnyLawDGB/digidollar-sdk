import { describe, it, expect } from 'vitest';
import { isDigiDollarTx, getDDTxType } from '../../src/detect.js';

// Version construction: (type << 24) | (flags << 16) | 0x0770
const mintVersion = (1 << 24) | 0x0770;      // 0x01000770
const transferVersion = (2 << 24) | 0x0770;  // 0x02000770
const redeemVersion = (3 << 24) | 0x0770;    // 0x03000770
const flaggedVersion = (1 << 24) | (0x01 << 16) | 0x0770; // mint with flags

describe('isDigiDollarTx', () => {
  it('detects mint transaction', () => {
    expect(isDigiDollarTx(mintVersion)).toBe(true);
  });

  it('detects transfer transaction', () => {
    expect(isDigiDollarTx(transferVersion)).toBe(true);
  });

  it('detects redeem transaction', () => {
    expect(isDigiDollarTx(redeemVersion)).toBe(true);
  });

  it('detects DD tx with flags set', () => {
    expect(isDigiDollarTx(flaggedVersion)).toBe(true);
  });

  it('rejects standard transaction (version 1)', () => {
    expect(isDigiDollarTx(1)).toBe(false);
  });

  it('rejects standard transaction (version 2)', () => {
    expect(isDigiDollarTx(2)).toBe(false);
  });

  it('rejects zero version', () => {
    expect(isDigiDollarTx(0)).toBe(false);
  });

  it('rejects partial marker match', () => {
    // Lower 16 bits = 0x0700, not 0x0770
    expect(isDigiDollarTx(0x01000700)).toBe(false);
  });

  it('accepts object with version field', () => {
    expect(isDigiDollarTx({ version: mintVersion })).toBe(true);
    expect(isDigiDollarTx({ version: 2 })).toBe(false);
  });

  it('rejects negative version (sign bit set)', () => {
    // Negative versions should not accidentally match
    expect(isDigiDollarTx(-1)).toBe(false);
  });
});

describe('getDDTxType', () => {
  it('returns mint for type 1', () => {
    expect(getDDTxType(mintVersion)).toBe('mint');
  });

  it('returns transfer for type 2', () => {
    expect(getDDTxType(transferVersion)).toBe('transfer');
  });

  it('returns redeem for type 3', () => {
    expect(getDDTxType(redeemVersion)).toBe('redeem');
  });

  it('returns null for non-DD version', () => {
    expect(getDDTxType(2)).toBeNull();
  });

  it('returns null for type 0 with DD marker', () => {
    // type=0 (DD_TX_NONE) with marker
    expect(getDDTxType(0x00000770)).toBeNull();
  });

  it('returns null for unknown type with DD marker', () => {
    // type=4 (DD_TX_MAX) with marker — invalid
    expect(getDDTxType((4 << 24) | 0x0770)).toBeNull();
    // type=255
    expect(getDDTxType((255 << 24) | 0x0770)).toBeNull();
  });

  it('handles flags correctly — type extraction ignores flags', () => {
    expect(getDDTxType(flaggedVersion)).toBe('mint');
  });
});
