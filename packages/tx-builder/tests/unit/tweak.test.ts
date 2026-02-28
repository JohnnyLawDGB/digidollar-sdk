import { describe, it, expect } from 'vitest';
import { tweakPublicKey } from '../../src/taproot/tweak.js';
import { NUMS_POINT } from '../../src/constants.js';
import { bytesToHex } from '@digidollar/tx-parser';
import { ownerKey, spenderKey } from './test-keys.js';

describe('tweakPublicKey', () => {
  it('tweaks NUMS point without merkle root', () => {
    const { outputKey, parity } = tweakPublicKey(NUMS_POINT);
    expect(outputKey.length).toBe(32);
    expect(parity === 0 || parity === 1).toBe(true);
  });

  it('tweaks NUMS point with merkle root', () => {
    const merkleRoot = new Uint8Array(32).fill(0xaa);
    const { outputKey, parity } = tweakPublicKey(NUMS_POINT, merkleRoot);
    expect(outputKey.length).toBe(32);
    expect(parity === 0 || parity === 1).toBe(true);
  });

  it('produces different outputs with different merkle roots', () => {
    const rootA = new Uint8Array(32).fill(0x01);
    const rootB = new Uint8Array(32).fill(0x02);
    const a = tweakPublicKey(NUMS_POINT, rootA);
    const b = tweakPublicKey(NUMS_POINT, rootB);
    expect(bytesToHex(a.outputKey)).not.toBe(bytesToHex(b.outputKey));
  });

  it('is deterministic', () => {
    const root = new Uint8Array(32).fill(0x42);
    const a = tweakPublicKey(NUMS_POINT, root);
    const b = tweakPublicKey(NUMS_POINT, root);
    expect(bytesToHex(a.outputKey)).toBe(bytesToHex(b.outputKey));
    expect(a.parity).toBe(b.parity);
  });

  it('tweaks a known key-path-only pubkey', () => {
    const { outputKey } = tweakPublicKey(ownerKey);
    expect(outputKey.length).toBe(32);
    // Output key should be different from input key (tweak applied)
    expect(bytesToHex(outputKey)).not.toBe(bytesToHex(ownerKey));
  });

  it('tweaks different keys to different outputs', () => {
    const a = tweakPublicKey(ownerKey);
    const b = tweakPublicKey(spenderKey);
    expect(bytesToHex(a.outputKey)).not.toBe(bytesToHex(b.outputKey));
  });
});
