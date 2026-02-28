import { describe, it, expect } from 'vitest';
import { selectCoins } from '../../src/coin-select.js';
import type { UTXO } from '../../src/types.js';

function makeUtxo(value: bigint, index = 0): UTXO {
  return {
    txid: 'a'.repeat(64),
    vout: index,
    value,
    scriptPubKey: '5120' + 'ab'.repeat(32),
  };
}

describe('selectCoins', () => {
  it('selects a single UTXO that covers the target', () => {
    const utxos = [makeUtxo(100_000_000n)];
    const result = selectCoins(utxos, 50_000_000n);
    expect(result.selected.length).toBe(1);
    expect(result.total).toBe(100_000_000n);
  });

  it('selects multiple UTXOs when needed', () => {
    const utxos = [makeUtxo(30_000n, 0), makeUtxo(40_000n, 1), makeUtxo(50_000n, 2)];
    const result = selectCoins(utxos, 80_000n);
    // Greedy largest-first: 50000 + 40000 = 90000 >= 80000
    expect(result.selected.length).toBe(2);
    expect(result.total).toBe(90_000n);
  });

  it('prefers largest UTXOs first', () => {
    const utxos = [makeUtxo(10n, 0), makeUtxo(1000n, 1), makeUtxo(100n, 2)];
    const result = selectCoins(utxos, 500n);
    expect(result.selected[0]!.value).toBe(1000n);
    expect(result.selected.length).toBe(1);
  });

  it('throws on insufficient funds', () => {
    const utxos = [makeUtxo(100n)];
    expect(() => selectCoins(utxos, 200n)).toThrow('Insufficient funds');
  });

  it('throws on empty UTXO set', () => {
    expect(() => selectCoins([], 100n)).toThrow('Insufficient funds');
  });

  it('skips zero-value UTXOs', () => {
    const utxos = [makeUtxo(0n, 0), makeUtxo(100n, 1)];
    const result = selectCoins(utxos, 50n);
    expect(result.selected.length).toBe(1);
    expect(result.total).toBe(100n);
  });

  it('handles exact match', () => {
    const utxos = [makeUtxo(100n)];
    const result = selectCoins(utxos, 100n);
    expect(result.total).toBe(100n);
  });
});
