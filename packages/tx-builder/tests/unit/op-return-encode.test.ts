import { describe, it, expect } from 'vitest';
import { encodeMintOpReturn, encodeTransferOpReturn, encodeRedeemOpReturn } from '../../src/op-return-encode.js';
import { parseOpReturn, bytesToHex } from '@digidollar/tx-parser';
import { ownerKey } from './test-keys.js';

describe('encodeMintOpReturn', () => {
  it('round-trips through parseOpReturn', () => {
    const encoded = encodeMintOpReturn(10000n, 172800n, 1n, ownerKey);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    expect(parsed!.txType).toBe('mint');
    if (parsed!.txType === 'mint') {
      expect(parsed!.ddAmountCents).toBe(10000n);
      expect(parsed!.lockHeight).toBe(172800n);
      expect(parsed!.lockTier).toBe(1n);
      expect(bytesToHex(parsed!.ownerPubKey)).toBe(bytesToHex(ownerKey));
    }
  });

  it('handles large amounts', () => {
    const encoded = encodeMintOpReturn(10_000_000n, 21_024_000n, 9n, ownerKey);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    if (parsed!.txType === 'mint') {
      expect(parsed!.ddAmountCents).toBe(10_000_000n);
      expect(parsed!.lockHeight).toBe(21_024_000n);
      expect(parsed!.lockTier).toBe(9n);
    }
  });

  it('starts with OP_RETURN', () => {
    const encoded = encodeMintOpReturn(100n, 240n, 0n, ownerKey);
    expect(encoded[0]).toBe(0x6a); // OP_RETURN
  });
});

describe('encodeTransferOpReturn', () => {
  it('round-trips single amount', () => {
    const encoded = encodeTransferOpReturn([5000n]);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    expect(parsed!.txType).toBe('transfer');
    if (parsed!.txType === 'transfer') {
      expect(parsed!.amounts).toEqual([5000n]);
    }
  });

  it('round-trips multiple amounts', () => {
    const amounts = [2500n, 3500n, 1000n];
    const encoded = encodeTransferOpReturn(amounts);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    if (parsed!.txType === 'transfer') {
      expect(parsed!.amounts).toEqual(amounts);
    }
  });

  it('handles large amounts', () => {
    const amounts = [5_000_000n, 5_000_000n];
    const encoded = encodeTransferOpReturn(amounts);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    if (parsed!.txType === 'transfer') {
      expect(parsed!.amounts).toEqual(amounts);
    }
  });
});

describe('encodeRedeemOpReturn', () => {
  it('round-trips through parseOpReturn', () => {
    const encoded = encodeRedeemOpReturn(10000n);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    expect(parsed!.txType).toBe('redeem');
    if (parsed!.txType === 'redeem') {
      expect(parsed!.ddAmountCents).toBe(10000n);
    }
  });

  it('handles small amounts', () => {
    const encoded = encodeRedeemOpReturn(100n);
    const parsed = parseOpReturn(encoded);

    expect(parsed).not.toBeNull();
    if (parsed!.txType === 'redeem') {
      expect(parsed!.ddAmountCents).toBe(100n);
    }
  });
});
