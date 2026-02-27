/**
 * UTXO classifier — the main entry point for transaction analysis.
 *
 * Classifies each output of a decoded transaction into:
 *   standard      — regular DGB, safe to spend
 *   dd_token      — zero-value P2TR representing DD ownership
 *   dd_collateral — P2TR with value > 0 holding locked DGB
 *   dd_metadata   — OP_RETURN containing DD protocol data
 */

import type { DecodedTx } from './types/transaction.js';
import type { ClassifiedOutput, ClassifiedTransaction, OutputClass } from './types/classified.js';
import type { DDOpReturnData } from './types/op-return.js';
import { OP_RETURN, OP_1, P2TR_SCRIPT_LENGTH, P2TR_PUSH_32 } from './types/constants.js';
import { isDigiDollarTx, getDDTxType } from './detect.js';
import { parseOpReturn } from './op-return.js';
import { hexToBytes } from './hex.js';

/**
 * Classify all outputs in a transaction.
 *
 * For non-DD transactions, all outputs are classified as 'standard'.
 * For DD transactions, outputs are classified based on script type and value.
 */
export function classifyTransaction(tx: DecodedTx): ClassifiedTransaction {
  const isDDTx = isDigiDollarTx(tx.version);
  const txType = getDDTxType(tx.version);

  let opReturnData: DDOpReturnData | null = null;

  if (isDDTx) {
    // Find and parse the DD OP_RETURN
    for (const output of tx.vout) {
      const parsed = parseOpReturn(output.scriptPubKey.hex);
      if (parsed) {
        opReturnData = parsed;
        break;
      }
    }
  }

  // Classify each output, tracking zero-value P2TR index for amount matching
  let ddTokenIndex = 0;
  const outputs: ClassifiedOutput[] = tx.vout.map((output): ClassifiedOutput => {
    if (!isDDTx) {
      return { ...output, index: output.n, classification: 'standard' as OutputClass };
    }

    const scriptBytes = hexToBytes(output.scriptPubKey.hex);

    // OP_RETURN → dd_metadata
    if (scriptBytes.length > 0 && scriptBytes[0] === OP_RETURN) {
      return { ...output, index: output.n, classification: 'dd_metadata' as OutputClass };
    }

    // P2TR detection: exactly 34 bytes, starts with OP_1 (0x51) + push-32 (0x20)
    const isP2TR = scriptBytes.length === P2TR_SCRIPT_LENGTH
      && scriptBytes[0] === OP_1
      && scriptBytes[1] === P2TR_PUSH_32;

    if (isP2TR && output.value === 0) {
      // DD token — zero-value P2TR output
      let ddAmountCents: bigint | undefined;

      if (opReturnData) {
        if (opReturnData.txType === 'transfer') {
          // Transfer: amounts map positionally to zero-value P2TR outputs
          ddAmountCents = opReturnData.amounts[ddTokenIndex];
        } else if (opReturnData.txType === 'mint' || opReturnData.txType === 'redeem') {
          // Mint/Redeem: single amount for the first zero-value P2TR
          if (ddTokenIndex === 0) {
            ddAmountCents = opReturnData.ddAmountCents;
          }
        }
      }

      ddTokenIndex++;
      return { ...output, index: output.n, classification: 'dd_token' as OutputClass, ddAmountCents };
    }

    if (isP2TR && output.value > 0) {
      // DD collateral — locked DGB in P2TR with MAST timelock
      return { ...output, index: output.n, classification: 'dd_collateral' as OutputClass };
    }

    // Non-P2TR output with value > 0 → standard DGB change
    return { ...output, index: output.n, classification: 'standard' as OutputClass };
  });

  return {
    txid: tx.txid,
    version: tx.version,
    isDigiDollar: isDDTx,
    txType,
    opReturn: opReturnData,
    outputs,
    tokens: outputs.filter(o => o.classification === 'dd_token'),
    collateral: outputs.filter(o => o.classification === 'dd_collateral'),
    metadata: outputs.filter(o => o.classification === 'dd_metadata'),
    standard: outputs.filter(o => o.classification === 'standard'),
  };
}
