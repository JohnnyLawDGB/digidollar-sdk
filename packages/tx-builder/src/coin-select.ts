/**
 * Greedy largest-first coin selection — ports txbuilder.cpp:46-95.
 *
 * Sorts UTXOs by value descending, greedily selects until target met.
 * Enforces MAX_TX_INPUTS to prevent oversized transactions.
 */

import { MAX_TX_INPUTS } from './constants.js';
import { CoinSelectionError } from './errors.js';
import type { UTXO } from './types.js';

export interface CoinSelection {
  /** Selected UTXOs */
  selected: UTXO[];
  /** Total value of selected UTXOs in sats */
  total: bigint;
}

/**
 * Select coins to meet a target value.
 *
 * @param utxos Available UTXOs
 * @param target Target value in sats
 * @returns Selected UTXOs and their total value
 */
export function selectCoins(utxos: UTXO[], target: bigint): CoinSelection {
  // Sort by value descending (largest first)
  const sorted = [...utxos]
    .filter(u => u.value > 0n)
    .sort((a, b) => (b.value > a.value ? 1 : b.value < a.value ? -1 : 0));

  const selected: UTXO[] = [];
  let total = 0n;

  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.value;

    if (total >= target) {
      return { selected, total };
    }

    if (selected.length >= MAX_TX_INPUTS) {
      if (total >= target) {
        return { selected, total };
      }
      throw new CoinSelectionError(
        `Reached ${MAX_TX_INPUTS} input limit with ${total} sats (need ${target}). ` +
        'Consolidate UTXOs first.',
      );
    }
  }

  throw new CoinSelectionError(
    `Insufficient funds: need ${target} sats, have ${total} sats`,
  );
}
