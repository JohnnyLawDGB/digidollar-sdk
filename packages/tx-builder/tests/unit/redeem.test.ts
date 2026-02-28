import { describe, it, expect } from 'vitest';
import { RedeemBuilder } from '../../src/builders/redeem.js';
import { DD_VERSION_REDEEM, SEQUENCE_CLTV_ENABLED, SEQUENCE_FINAL } from '../../src/constants.js';
import { parseOpReturn } from '@digidollar/tx-parser';
import type { RedeemParams, DDTokenUTXO, UTXO } from '../../src/types.js';
import { ownerKey, changeDest, collateralDest } from './test-keys.js';

function makeCollateralUtxo(value: bigint): UTXO {
  return {
    txid: 'aa'.repeat(32),
    vout: 0,
    value,
    scriptPubKey: '5120' + 'bb'.repeat(32),
  };
}

function makeDDUtxo(ddAmountCents: bigint, index: number): DDTokenUTXO {
  return {
    txid: 'dd'.repeat(32),
    vout: index,
    value: 0n,
    scriptPubKey: '5120' + 'ab'.repeat(32),
    ddAmountCents,
  };
}

function makeFeeUtxo(value: bigint): UTXO {
  return {
    txid: 'ff'.repeat(32),
    vout: 0,
    value,
    scriptPubKey: '5120' + 'ee'.repeat(32),
  };
}

function makeParams(overrides?: Partial<RedeemParams>): RedeemParams {
  return {
    collateralUtxo: makeCollateralUtxo(1_000_000_000_000n),
    ddToRedeemCents: 10_000n,
    ddUtxos: [makeDDUtxo(10_000n, 0)],
    feeUtxos: [makeFeeUtxo(100_000_000n)],
    ownerPubKey: ownerKey,
    currentHeight: 300_000,
    unlockHeight: 232_800,
    collateralAmount: 1_000_000_000_000n,
    feeRate: 100n,
    collateralDest,
    changeDest,
    ...overrides,
  };
}

describe('RedeemBuilder', () => {
  it('builds a valid unsigned transaction', () => {
    const result = RedeemBuilder.build(makeParams());
    expect(result.tx.length).toBeGreaterThan(0);
    expect(result.txid.length).toBe(64);
    expect(result.fee).toBeGreaterThan(0n);
  });

  it('sets correct nVersion = 0x03000770', () => {
    const result = RedeemBuilder.build(makeParams());
    expect(result.unsignedTx.version).toBe(DD_VERSION_REDEEM);
  });

  it('sets nLockTime to unlockHeight', () => {
    const result = RedeemBuilder.build(makeParams({ unlockHeight: 232_800 }));
    expect(result.unsignedTx.locktime).toBe(232_800);
  });

  it('sets nSequence = 0xFFFFFFFE for collateral and DD inputs', () => {
    const result = RedeemBuilder.build(makeParams());
    const inputs = result.unsignedTx.inputs;

    expect(inputs[0]!.sequence).toBe(SEQUENCE_CLTV_ENABLED);
    expect(inputs[1]!.sequence).toBe(SEQUENCE_CLTV_ENABLED);
  });

  it('sets nSequence = 0xFFFFFFFF for fee inputs', () => {
    const result = RedeemBuilder.build(makeParams());
    const inputs = result.unsignedTx.inputs;
    const lastInput = inputs[inputs.length - 1]!;
    expect(lastInput.sequence).toBe(SEQUENCE_FINAL);
  });

  it('returns full collateral in output[0]', () => {
    const result = RedeemBuilder.build(makeParams());
    const outputs = result.unsignedTx.outputs;
    expect(outputs[0]!.value).toBe(1_000_000_000_000n);
  });

  it('does not create DD change for full redeem', () => {
    const result = RedeemBuilder.build(makeParams());
    const opReturnOutputs = result.unsignedTx.outputs.filter(
      o => o.scriptPubKey[0] === 0x6a,
    );
    expect(opReturnOutputs.length).toBe(0);
  });

  it('creates DD change output for partial redeem', () => {
    const params = makeParams({
      ddToRedeemCents: 5_000n,
      ddUtxos: [makeDDUtxo(10_000n, 0)],
    });
    const result = RedeemBuilder.build(params);

    const opReturnOutput = result.unsignedTx.outputs.find(
      o => o.scriptPubKey[0] === 0x6a,
    );
    expect(opReturnOutput).toBeDefined();

    const parsed = parseOpReturn(opReturnOutput!.scriptPubKey);
    expect(parsed!.txType).toBe('redeem');
    if (parsed!.txType === 'redeem') {
      expect(parsed!.ddAmountCents).toBe(5_000n);
    }
  });

  it('rejects redeem before unlock height', () => {
    const params = makeParams({
      currentHeight: 200_000,
      unlockHeight: 232_800,
    });
    expect(() => RedeemBuilder.build(params)).toThrow('not yet unlocked');
  });

  it('rejects insufficient DD for redeem', () => {
    const params = makeParams({
      ddToRedeemCents: 20_000n,
      ddUtxos: [makeDDUtxo(10_000n, 0)],
    });
    expect(() => RedeemBuilder.build(params)).toThrow('Insufficient DD');
  });

  it('rejects zero redeem amount', () => {
    expect(() => RedeemBuilder.build(makeParams({ ddToRedeemCents: 0n }))).toThrow();
  });

  it('orders inputs: collateral, DD, fee', () => {
    const result = RedeemBuilder.build(makeParams());
    const inputs = result.unsignedTx.inputs;

    expect(inputs[0]!.txid).toBe('aa'.repeat(32));
    expect(inputs[1]!.txid).toBe('dd'.repeat(32));
    expect(inputs[2]!.txid).toBe('ff'.repeat(32));
  });
});
