import { describe, it, expect } from 'vitest';
import { taggedHash, tapleafHash, tapbranchHash, tapTweakHash } from '../../src/taproot/tagged-hash.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@digidollar/tx-parser';

describe('taggedHash', () => {
  it('produces a 32-byte hash', () => {
    const result = taggedHash('TapLeaf', new Uint8Array(32));
    expect(result.length).toBe(32);
  });

  it('is deterministic', () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const a = taggedHash('Test', data);
    const b = taggedHash('Test', data);
    expect(bytesToHex(a)).toBe(bytesToHex(b));
  });

  it('different tags produce different hashes', () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const a = taggedHash('TagA', data);
    const b = taggedHash('TagB', data);
    expect(bytesToHex(a)).not.toBe(bytesToHex(b));
  });

  it('matches manual computation', () => {
    const tag = 'TapTweak';
    const data = new Uint8Array(32);
    const tagHash = sha256(new TextEncoder().encode(tag));
    const manual = sha256(new Uint8Array([...tagHash, ...tagHash, ...data]));
    const result = taggedHash(tag, data);
    expect(bytesToHex(result)).toBe(bytesToHex(manual));
  });
});

describe('tapleafHash', () => {
  it('produces a 32-byte hash', () => {
    const script = new Uint8Array([0xb1, 0x75, 0xac]); // CLTV DROP CHECKSIG
    const hash = tapleafHash(script);
    expect(hash.length).toBe(32);
  });

  it('uses leaf version 0xC0 by default', () => {
    const script = new Uint8Array([0xac]); // CHECKSIG
    const a = tapleafHash(script);
    const b = tapleafHash(script, 0xc0);
    expect(bytesToHex(a)).toBe(bytesToHex(b));
  });

  it('different scripts produce different hashes', () => {
    const a = tapleafHash(new Uint8Array([0xac]));
    const b = tapleafHash(new Uint8Array([0xad]));
    expect(bytesToHex(a)).not.toBe(bytesToHex(b));
  });
});

describe('tapbranchHash', () => {
  it('is commutative (order-independent)', () => {
    const a = new Uint8Array(32).fill(0x01);
    const b = new Uint8Array(32).fill(0x02);
    const hash1 = tapbranchHash(a, b);
    const hash2 = tapbranchHash(b, a);
    expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
  });

  it('produces a 32-byte hash', () => {
    const a = new Uint8Array(32);
    const b = new Uint8Array(32).fill(0xff);
    expect(tapbranchHash(a, b).length).toBe(32);
  });
});

describe('tapTweakHash', () => {
  it('works without merkle root (key-path only)', () => {
    const pubkey = new Uint8Array(32).fill(0x02);
    const hash = tapTweakHash(pubkey);
    expect(hash.length).toBe(32);
  });

  it('works with merkle root', () => {
    const pubkey = new Uint8Array(32).fill(0x02);
    const merkleRoot = new Uint8Array(32).fill(0x03);
    const hash = tapTweakHash(pubkey, merkleRoot);
    expect(hash.length).toBe(32);
  });

  it('produces different results with vs without merkle root', () => {
    const pubkey = new Uint8Array(32).fill(0x02);
    const merkleRoot = new Uint8Array(32).fill(0x03);
    const withRoot = tapTweakHash(pubkey, merkleRoot);
    const withoutRoot = tapTweakHash(pubkey);
    expect(bytesToHex(withRoot)).not.toBe(bytesToHex(withoutRoot));
  });
});
