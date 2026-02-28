import { describe, it, expect } from 'vitest';
import { MintBuilder } from '../../src/builders/mint.js';
import { DD_VERSION_MINT } from '../../src/constants.js';
import { classifyTransaction, parseOpReturn, bytesToHex } from '@digidollar/tx-parser';
import type { MintParams } from '../../src/types.js';
import type { DecodedTx } from '@digidollar/tx-parser';
import { ownerKey, changeDest } from './test-keys.js';

function makeParams(overrides?: Partial<MintParams>): MintParams {
  return {
    ddAmountCents: 10_000n,              // $100 DD
    lockTier: 1,                          // 30 days, 500%
    ownerPubKey: ownerKey,
    oraclePriceMicroUsd: 6_310n,          // $0.00631
    currentHeight: 60_000,
    utxos: [
      {
        txid: 'aa'.repeat(32),
        vout: 0,
        value: 10_000_000_000_000n,       // 100,000 DGB
        scriptPubKey: '5120' + 'bb'.repeat(32),
      },
    ],
    feeRate: 100n,
    changeDest,
    ...overrides,
  };
}

describe('MintBuilder', () => {
  it('builds a valid unsigned transaction', () => {
    const result = MintBuilder.build(makeParams());

    expect(result.tx.length).toBeGreaterThan(0);
    expect(result.txid.length).toBe(64);
    expect(result.fee).toBeGreaterThan(0n);
    expect(result.unsignedTx.version).toBe(DD_VERSION_MINT);
  });

  it('sets correct nVersion = 0x01000770', () => {
    const result = MintBuilder.build(makeParams());
    expect(result.unsignedTx.version).toBe(0x01000770);
  });

  it('creates correct output structure', () => {
    const result = MintBuilder.build(makeParams());
    const outputs = result.unsignedTx.outputs;

    // At least 3 outputs: collateral, token, OP_RETURN
    expect(outputs.length).toBeGreaterThanOrEqual(3);

    // [0] Collateral — has value, P2TR
    expect(outputs[0]!.value).toBeGreaterThan(0n);
    expect(outputs[0]!.scriptPubKey.length).toBe(34);
    expect(outputs[0]!.scriptPubKey[0]).toBe(0x51);

    // [1] DD token — zero value, P2TR
    expect(outputs[1]!.value).toBe(0n);
    expect(outputs[1]!.scriptPubKey.length).toBe(34);
    expect(outputs[1]!.scriptPubKey[0]).toBe(0x51);

    // [2] OP_RETURN — zero value, starts with OP_RETURN
    expect(outputs[2]!.value).toBe(0n);
    expect(outputs[2]!.scriptPubKey[0]).toBe(0x6a);
  });

  it('OP_RETURN parses correctly as mint metadata', () => {
    const result = MintBuilder.build(makeParams());
    const opReturnScript = result.unsignedTx.outputs[2]!.scriptPubKey;
    const parsed = parseOpReturn(opReturnScript);

    expect(parsed).not.toBeNull();
    expect(parsed!.txType).toBe('mint');
    if (parsed!.txType === 'mint') {
      expect(parsed!.ddAmountCents).toBe(10_000n);
      expect(parsed!.lockTier).toBe(1n);
      expect(bytesToHex(parsed!.ownerPubKey)).toBe(bytesToHex(ownerKey));
    }
  });

  it('creates change output when excess funds', () => {
    const result = MintBuilder.build(makeParams());
    expect(result.unsignedTx.outputs.length).toBe(4); // collateral, token, OP_RETURN, change
  });

  it('classifies correctly via tx-parser', () => {
    // Use P2WPKH change dest so classifier marks it 'standard' not 'dd_collateral'
    const p2wpkhChange = '0014' + 'cc'.repeat(20); // OP_0 <20-byte hash>
    const result = MintBuilder.build(makeParams({ changeDest: p2wpkhChange }));
    const outputs = result.unsignedTx.outputs;

    const decoded: DecodedTx = {
      txid: result.txid,
      hash: result.txid,
      version: DD_VERSION_MINT,
      size: result.tx.length,
      vsize: result.tx.length,
      weight: result.tx.length * 4,
      locktime: 0,
      vin: [],
      vout: outputs.map((out, i) => ({
        value: Number(out.value) / 1e8,
        n: i,
        scriptPubKey: {
          asm: '',
          hex: bytesToHex(out.scriptPubKey),
          type: out.scriptPubKey[0] === 0x51 ? 'witness_v1_taproot' :
                out.scriptPubKey[0] === 0x6a ? 'nulldata' : 'unknown',
        },
      })),
    };

    const classified = classifyTransaction(decoded);
    expect(classified.isDigiDollar).toBe(true);
    expect(classified.txType).toBe('mint');
    expect(classified.collateral.length).toBe(1);
    expect(classified.tokens.length).toBe(1);
    expect(classified.metadata.length).toBe(1);
    expect(classified.standard.length).toBe(1); // change output
  });

  it('rejects invalid parameters', () => {
    expect(() => MintBuilder.build(makeParams({ ddAmountCents: 0n }))).toThrow();
    expect(() => MintBuilder.build(makeParams({ lockTier: -1 }))).toThrow();
    expect(() => MintBuilder.build(makeParams({ lockTier: 10 }))).toThrow();
    expect(() => MintBuilder.build(makeParams({ ownerPubKey: new Uint8Array(16) }))).toThrow();
    expect(() => MintBuilder.build(makeParams({ oraclePriceMicroUsd: 0n }))).toThrow();
  });

  it('sets locktime to 0', () => {
    const result = MintBuilder.build(makeParams());
    expect(result.unsignedTx.locktime).toBe(0);
  });

  it('calculates lock height correctly', () => {
    const result = MintBuilder.build(makeParams({ currentHeight: 60_000, lockTier: 1 }));
    // Tier 1 = 172,800 blocks, so lockHeight = 60,000 + 172,800 = 232,800
    const opReturnScript = result.unsignedTx.outputs[2]!.scriptPubKey;
    const parsed = parseOpReturn(opReturnScript);
    if (parsed!.txType === 'mint') {
      expect(parsed!.lockHeight).toBe(232_800n);
    }
  });
});
