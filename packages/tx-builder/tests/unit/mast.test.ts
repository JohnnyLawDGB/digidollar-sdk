import { describe, it, expect } from 'vitest';
import { buildCollateralMAST, buildTokenP2TR } from '../../src/taproot/mast.js';
import { OP_1 } from '../../src/constants.js';
import { bytesToHex } from '@digidollar/tx-parser';
import { ownerKey, spenderKey } from './test-keys.js';

const lockHeight = 172800;

describe('buildCollateralMAST', () => {
  it('returns a 34-byte P2TR scriptPubKey', () => {
    const result = buildCollateralMAST(ownerKey, lockHeight);
    expect(result.scriptPubKey.length).toBe(34);
    expect(result.scriptPubKey[0]).toBe(OP_1);
    expect(result.scriptPubKey[1]).toBe(0x20);
  });

  it('returns 32-byte output key', () => {
    const result = buildCollateralMAST(ownerKey, lockHeight);
    expect(result.outputKey.length).toBe(32);
  });

  it('returns valid parity', () => {
    const result = buildCollateralMAST(ownerKey, lockHeight);
    expect(result.parity === 0 || result.parity === 1).toBe(true);
  });

  it('returns 32-byte merkle root', () => {
    const result = buildCollateralMAST(ownerKey, lockHeight);
    expect(result.merkleRoot.length).toBe(32);
  });

  it('returns both leaf scripts', () => {
    const result = buildCollateralMAST(ownerKey, lockHeight);
    expect(result.normalLeaf.length).toBeGreaterThan(0);
    expect(result.errLeaf.length).toBeGreaterThan(0);
    expect(result.errLeaf.length).toBeGreaterThan(result.normalLeaf.length);
  });

  it('returns 32-byte leaf hashes', () => {
    const result = buildCollateralMAST(ownerKey, lockHeight);
    expect(result.normalLeafHash.length).toBe(32);
    expect(result.errLeafHash.length).toBe(32);
  });

  it('is deterministic given same inputs', () => {
    const a = buildCollateralMAST(ownerKey, lockHeight);
    const b = buildCollateralMAST(ownerKey, lockHeight);
    expect(bytesToHex(a.scriptPubKey)).toBe(bytesToHex(b.scriptPubKey));
    expect(bytesToHex(a.outputKey)).toBe(bytesToHex(b.outputKey));
    expect(bytesToHex(a.merkleRoot)).toBe(bytesToHex(b.merkleRoot));
    expect(a.parity).toBe(b.parity);
  });

  it('different lock heights produce different output keys', () => {
    const a = buildCollateralMAST(ownerKey, 1000);
    const b = buildCollateralMAST(ownerKey, 2000);
    expect(bytesToHex(a.outputKey)).not.toBe(bytesToHex(b.outputKey));
  });

  it('different owner keys produce different output keys', () => {
    const a = buildCollateralMAST(ownerKey, lockHeight);
    const b = buildCollateralMAST(spenderKey, lockHeight);
    expect(bytesToHex(a.outputKey)).not.toBe(bytesToHex(b.outputKey));
  });
});

describe('buildTokenP2TR', () => {
  it('returns a 34-byte P2TR scriptPubKey', () => {
    const script = buildTokenP2TR(ownerKey);
    expect(script.length).toBe(34);
    expect(script[0]).toBe(OP_1);
    expect(script[1]).toBe(0x20);
  });

  it('is deterministic', () => {
    const a = buildTokenP2TR(ownerKey);
    const b = buildTokenP2TR(ownerKey);
    expect(bytesToHex(a)).toBe(bytesToHex(b));
  });

  it('different keys produce different scripts', () => {
    expect(bytesToHex(buildTokenP2TR(ownerKey))).not.toBe(bytesToHex(buildTokenP2TR(spenderKey)));
  });

  it('token P2TR differs from collateral P2TR for same key', () => {
    const tokenScript = buildTokenP2TR(ownerKey);
    const collateral = buildCollateralMAST(ownerKey, lockHeight);
    expect(bytesToHex(tokenScript)).not.toBe(bytesToHex(collateral.scriptPubKey));
  });
});
