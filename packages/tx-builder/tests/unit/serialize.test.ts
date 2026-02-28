import { describe, it, expect } from 'vitest';
import { serializeTransaction, serializeForTxid, computeTxid } from '../../src/tx/serialize.js';
import { DD_VERSION_MINT } from '../../src/constants.js';
import type { UnsignedTx } from '../../src/types.js';

function makeTx(overrides?: Partial<UnsignedTx>): UnsignedTx {
  return {
    version: DD_VERSION_MINT,
    inputs: [{
      txid: 'aa'.repeat(32),
      vout: 0,
      scriptSig: new Uint8Array(0),
      sequence: 0xffffffff,
      witness: [],
    }],
    outputs: [{
      value: 100_000_000n,
      scriptPubKey: new Uint8Array([0x51, 0x20, ...new Array(32).fill(0xab)]),
    }],
    locktime: 0,
    ...overrides,
  };
}

describe('serializeTransaction', () => {
  it('produces non-empty bytes', () => {
    const tx = makeTx();
    const result = serializeTransaction(tx);
    expect(result.length).toBeGreaterThan(0);
  });

  it('starts with version bytes (little-endian)', () => {
    const tx = makeTx();
    const result = serializeTransaction(tx);
    // DD_VERSION_MINT = 0x01000770
    // LE: 70 07 00 01
    expect(result[0]).toBe(0x70);
    expect(result[1]).toBe(0x07);
    expect(result[2]).toBe(0x00);
    expect(result[3]).toBe(0x01);
  });

  it('ends with locktime bytes', () => {
    const tx = makeTx({ locktime: 0 });
    const result = serializeTransaction(tx);
    const last4 = result.slice(-4);
    expect(last4).toEqual(new Uint8Array([0, 0, 0, 0]));
  });

  it('includes witness marker/flag when witness present', () => {
    const tx = makeTx();
    tx.inputs[0]!.witness = [new Uint8Array([0x01, 0x02])];
    const result = serializeTransaction(tx);
    // After version (4 bytes), marker + flag = 0x00 0x01
    expect(result[4]).toBe(0x00);
    expect(result[5]).toBe(0x01);
  });

  it('omits witness marker/flag when no witness', () => {
    const tx = makeTx();
    const result = serializeTransaction(tx);
    // After version (4 bytes), input count should follow directly
    expect(result[4]).toBe(0x01); // 1 input
  });
});

describe('serializeForTxid', () => {
  it('never includes witness data', () => {
    const tx = makeTx();
    tx.inputs[0]!.witness = [new Uint8Array([0x01, 0x02])];
    const withWitness = serializeTransaction(tx);
    const forTxid = serializeForTxid(tx);
    expect(forTxid.length).toBeLessThan(withWitness.length);
  });

  it('produces same result regardless of witness', () => {
    const txNoWit = makeTx();
    const txWithWit = makeTx();
    txWithWit.inputs[0]!.witness = [new Uint8Array(64)];
    const a = serializeForTxid(txNoWit);
    const b = serializeForTxid(txWithWit);
    expect(a).toEqual(b);
  });
});

describe('computeTxid', () => {
  it('returns 64-char hex string', () => {
    const tx = makeTx();
    const txid = computeTxid(tx);
    expect(txid.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(txid)).toBe(true);
  });

  it('is deterministic', () => {
    const tx = makeTx();
    expect(computeTxid(tx)).toBe(computeTxid(tx));
  });

  it('differs for different transactions', () => {
    const txA = makeTx({ locktime: 0 });
    const txB = makeTx({ locktime: 100 });
    expect(computeTxid(txA)).not.toBe(computeTxid(txB));
  });
});
