/**
 * DD OP_RETURN parser.
 *
 * Parses the metadata from DigiDollar OP_RETURN scripts:
 *   MINT:     OP_RETURN "DD" <1> <ddAmount> <lockHeight> <lockTier> <ownerPubKey:32>
 *   TRANSFER: OP_RETURN "DD" <2> <amount1> <amount2> ...
 *   REDEEM:   OP_RETURN "DD" <3> <ddAmount>
 *
 * All numeric values are CScriptNum-encoded.
 */

import type { DDOpReturnData, DDMintOpReturn, DDTransferOpReturn, DDRedeemOpReturn } from './types/op-return.js';
import { OP_RETURN, DD_OP_RETURN_MARKER_0, DD_OP_RETURN_MARKER_1 } from './types/constants.js';
import { iterScript } from './script-iter.js';
import { decodeScriptNum } from './script-num.js';
import { hexToBytes } from './hex.js';

/**
 * Parse a DD OP_RETURN script into structured data.
 * Returns null for non-DD scripts or scripts that fail to parse.
 */
export function parseOpReturn(input: string | Uint8Array): DDOpReturnData | null {
  const script = typeof input === 'string' ? hexToBytes(input) : input;

  try {
    const iter = iterScript(script);

    // First opcode must be OP_RETURN
    const op0 = iter.next();
    if (op0.done || op0.value.opcode !== OP_RETURN) return null;

    // Second push must be "DD" marker (2 bytes: 0x44 0x44)
    const op1 = iter.next();
    if (op1.done) return null;
    const marker = op1.value.data;
    if (!marker || marker.length !== 2 || marker[0] !== DD_OP_RETURN_MARKER_0 || marker[1] !== DD_OP_RETURN_MARKER_1) {
      return null;
    }

    // Third push is txType (CScriptNum)
    const op2 = iter.next();
    if (op2.done || !op2.value.data) return null;
    const txType = Number(decodeScriptNum(op2.value.data));

    if (txType === 1) return parseMint(iter);
    if (txType === 2) return parseTransfer(iter);
    if (txType === 3) return parseRedeem(iter);

    return null;
  } catch {
    return null;
  }
}

function parseMint(iter: Generator<import('./script-iter.js').ScriptOp>): DDMintOpReturn | null {
  // <ddAmount> <lockHeight> <lockTier> <ownerXOnlyPubKey:32>
  const opAmount = iter.next();
  if (opAmount.done || !opAmount.value.data) return null;
  const ddAmountCents = decodeScriptNum(opAmount.value.data);

  const opLockHeight = iter.next();
  if (opLockHeight.done || !opLockHeight.value.data) return null;
  const lockHeight = decodeScriptNum(opLockHeight.value.data);

  const opLockTier = iter.next();
  if (opLockTier.done || !opLockTier.value.data) return null;
  const lockTier = decodeScriptNum(opLockTier.value.data);

  const opPubKey = iter.next();
  if (opPubKey.done || !opPubKey.value.data || opPubKey.value.data.length !== 32) return null;
  const ownerPubKey = opPubKey.value.data;

  return { txType: 'mint', ddAmountCents, lockHeight, lockTier, ownerPubKey };
}

function parseTransfer(iter: Generator<import('./script-iter.js').ScriptOp>): DDTransferOpReturn | null {
  // <amount1> <amount2> ... (all remaining pushes are DD amounts)
  const amounts: bigint[] = [];
  for (const op of iter) {
    if (op.data && op.data.length > 0) {
      amounts.push(decodeScriptNum(op.data));
    }
  }
  if (amounts.length === 0) return null;
  return { txType: 'transfer', amounts };
}

function parseRedeem(iter: Generator<import('./script-iter.js').ScriptOp>): DDRedeemOpReturn | null {
  // <ddAmount>
  const opAmount = iter.next();
  if (opAmount.done || !opAmount.value.data) return null;
  const ddAmountCents = decodeScriptNum(opAmount.value.data);

  return { txType: 'redeem', ddAmountCents };
}
