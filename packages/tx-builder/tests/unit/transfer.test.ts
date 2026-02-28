import { describe, it, expect } from 'vitest';
import { TransferBuilder } from '../../src/builders/transfer.js';
import { DD_VERSION_TRANSFER } from '../../src/constants.js';
import { parseOpReturn } from '@digidollar/tx-parser';
import type { TransferParams, DDTokenUTXO, UTXO } from '../../src/types.js';
import { spenderKey, recipientKeyA, recipientKeyB, changeDest } from './test-keys.js';

function makeDDUtxo(ddAmountCents: bigint, index: number): DDTokenUTXO {
  return {
    txid: 'dd'.repeat(32),
    vout: index,
    value: 0n,
    scriptPubKey: '5120' + 'ab'.repeat(32),
    ddAmountCents,
  };
}

function makeFeeUtxo(value: bigint, index: number): UTXO {
  return {
    txid: 'ff'.repeat(32),
    vout: index,
    value,
    scriptPubKey: '5120' + 'ee'.repeat(32),
  };
}

function makeParams(overrides?: Partial<TransferParams>): TransferParams {
  return {
    recipients: [
      { recipientPubKey: recipientKeyA, ddAmountCents: 3000n },
      { recipientPubKey: recipientKeyB, ddAmountCents: 2000n },
    ],
    ddUtxos: [makeDDUtxo(5000n, 0)],
    feeUtxos: [makeFeeUtxo(100_000_000n, 0)],
    spenderPubKey: spenderKey,
    feeRate: 100n,
    changeDest,
    ...overrides,
  };
}

describe('TransferBuilder', () => {
  it('builds a valid unsigned transaction', () => {
    const result = TransferBuilder.build(makeParams());
    expect(result.tx.length).toBeGreaterThan(0);
    expect(result.txid.length).toBe(64);
    expect(result.fee).toBeGreaterThan(0n);
  });

  it('sets correct nVersion = 0x02000770', () => {
    const result = TransferBuilder.build(makeParams());
    expect(result.unsignedTx.version).toBe(DD_VERSION_TRANSFER);
  });

  it('creates P2TR outputs for each recipient', () => {
    const result = TransferBuilder.build(makeParams());
    const outputs = result.unsignedTx.outputs;

    // [0] Recipient A — zero value P2TR
    expect(outputs[0]!.value).toBe(0n);
    expect(outputs[0]!.scriptPubKey[0]).toBe(0x51);
    expect(outputs[0]!.scriptPubKey.length).toBe(34);

    // [1] Recipient B — zero value P2TR
    expect(outputs[1]!.value).toBe(0n);
    expect(outputs[1]!.scriptPubKey[0]).toBe(0x51);
  });

  it('conserves DD amounts (no change when exact)', () => {
    const params = makeParams({
      recipients: [{ recipientPubKey: recipientKeyA, ddAmountCents: 5000n }],
      ddUtxos: [makeDDUtxo(5000n, 0)],
    });
    const result = TransferBuilder.build(params);

    const opReturnOutput = result.unsignedTx.outputs.find(
      o => o.scriptPubKey[0] === 0x6a,
    );
    expect(opReturnOutput).toBeDefined();
    const parsed = parseOpReturn(opReturnOutput!.scriptPubKey);
    expect(parsed!.txType).toBe('transfer');
    if (parsed!.txType === 'transfer') {
      expect(parsed!.amounts).toEqual([5000n]);
    }
  });

  it('includes DD change when input > output', () => {
    const params = makeParams({
      recipients: [{ recipientPubKey: recipientKeyA, ddAmountCents: 3000n }],
      ddUtxos: [makeDDUtxo(5000n, 0)],
    });
    const result = TransferBuilder.build(params);

    const opReturnOutput = result.unsignedTx.outputs.find(
      o => o.scriptPubKey[0] === 0x6a,
    );
    const parsed = parseOpReturn(opReturnOutput!.scriptPubKey);
    if (parsed!.txType === 'transfer') {
      expect(parsed!.amounts).toEqual([3000n, 2000n]);
      const total = parsed!.amounts.reduce((a, b) => a + b, 0n);
      expect(total).toBe(5000n);
    }
  });

  it('DD conservation holds for 2-recipient transfer', () => {
    const result = TransferBuilder.build(makeParams());
    const opReturnOutput = result.unsignedTx.outputs.find(
      o => o.scriptPubKey[0] === 0x6a,
    );
    const parsed = parseOpReturn(opReturnOutput!.scriptPubKey);
    if (parsed!.txType === 'transfer') {
      const total = parsed!.amounts.reduce((a, b) => a + b, 0n);
      expect(total).toBe(5000n);
    }
  });

  it('places DD inputs before fee inputs', () => {
    const result = TransferBuilder.build(makeParams());
    const inputs = result.unsignedTx.inputs;
    expect(inputs[0]!.txid).toBe('dd'.repeat(32));
    expect(inputs[1]!.txid).toBe('ff'.repeat(32));
  });

  it('rejects insufficient DD', () => {
    const params = makeParams({
      recipients: [{ recipientPubKey: recipientKeyA, ddAmountCents: 10000n }],
      ddUtxos: [makeDDUtxo(5000n, 0)],
    });
    expect(() => TransferBuilder.build(params)).toThrow('Insufficient DD');
  });

  it('rejects empty recipients', () => {
    expect(() => TransferBuilder.build(makeParams({ recipients: [] }))).toThrow();
  });

  it('rejects zero-amount recipients', () => {
    const params = makeParams({
      recipients: [{ recipientPubKey: recipientKeyA, ddAmountCents: 0n }],
    });
    expect(() => TransferBuilder.build(params)).toThrow();
  });
});
