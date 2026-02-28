/**
 * DD OP_RETURN script encoder — inverse of tx-parser's parseOpReturn().
 *
 * MINT:     OP_RETURN "DD" <1> <ddAmount> <lockHeight> <lockTier> <ownerPubKey:32>
 * TRANSFER: OP_RETURN "DD" <2> <amount1> <amount2> ...
 * REDEEM:   OP_RETURN "DD" <3> <ddAmount>
 */

import { OP_RETURN } from './constants.js';
import { pushData, pushNum, opcode } from './tx/script-builder.js';

const DD_MARKER = new Uint8Array([0x44, 0x44]); // "DD"

/** Build OP_RETURN script for a DD mint transaction. */
export function encodeMintOpReturn(
  ddAmountCents: bigint,
  lockHeight: bigint,
  lockTier: bigint,
  ownerPubKey: Uint8Array,
): Uint8Array {
  return concat([
    opcode(OP_RETURN),
    pushData(DD_MARKER),
    pushNum(1n),                    // txType = MINT
    pushNum(ddAmountCents),
    pushNum(lockHeight),
    pushNum(lockTier),
    pushData(ownerPubKey),          // 32-byte x-only pubkey
  ]);
}

/** Build OP_RETURN script for a DD transfer transaction. */
export function encodeTransferOpReturn(amounts: bigint[]): Uint8Array {
  const parts: Uint8Array[] = [
    opcode(OP_RETURN),
    pushData(DD_MARKER),
    pushNum(2n),                    // txType = TRANSFER
  ];
  for (const amount of amounts) {
    parts.push(pushNum(amount));
  }
  return concat(parts);
}

/** Build OP_RETURN script for a DD redeem transaction. */
export function encodeRedeemOpReturn(ddAmountCents: bigint): Uint8Array {
  return concat([
    opcode(OP_RETURN),
    pushData(DD_MARKER),
    pushNum(3n),                    // txType = REDEEM
    pushNum(ddAmountCents),
  ]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}
