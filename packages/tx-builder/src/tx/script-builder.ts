/**
 * Low-level script construction helpers.
 *
 * Provides pushData (correct opcode selection for OP_PUSHDATA1/2/4),
 * pushNum (CScriptNum via encodeScriptNum), and opcode.
 */

import { encodeScriptNum } from '@digidollar/tx-parser';
import { OP_0, OP_PUSHDATA1, OP_PUSHDATA2, OP_PUSHDATA4 } from '../constants.js';

/**
 * Push arbitrary data onto the stack with correct opcode encoding.
 *
 * 0 bytes:      OP_0 (0x00)
 * 1-75 bytes:   <len> <data> (direct push)
 * 76-255 bytes: OP_PUSHDATA1 <1-byte-len> <data>
 * 256-65535:    OP_PUSHDATA2 <2-byte-LE-len> <data>
 * 65536+:       OP_PUSHDATA4 <4-byte-LE-len> <data>
 */
export function pushData(data: Uint8Array): Uint8Array {
  const len = data.length;

  if (len === 0) {
    return new Uint8Array([OP_0]);
  }

  if (len <= 75) {
    // Direct push: opcode IS the byte count
    const result = new Uint8Array(1 + len);
    result[0] = len;
    result.set(data, 1);
    return result;
  }

  if (len <= 255) {
    const result = new Uint8Array(2 + len);
    result[0] = OP_PUSHDATA1;
    result[1] = len;
    result.set(data, 2);
    return result;
  }

  if (len <= 65535) {
    const result = new Uint8Array(3 + len);
    result[0] = OP_PUSHDATA2;
    result[1] = len & 0xff;
    result[2] = (len >> 8) & 0xff;
    result.set(data, 3);
    return result;
  }

  const result = new Uint8Array(5 + len);
  result[0] = OP_PUSHDATA4;
  result[1] = len & 0xff;
  result[2] = (len >> 8) & 0xff;
  result[3] = (len >> 16) & 0xff;
  result[4] = (len >> 24) & 0xff;
  result.set(data, 5);
  return result;
}

/**
 * Push a number onto the stack as CScriptNum.
 *
 * Always uses CScriptNum serialization + pushData — matching C++'s
 * CScript::operator<<(CScriptNum) which calls getvch() then push_back.
 * This ensures compatibility with iterScript/parseOpReturn which
 * expect data pushes, not OP_1..OP_16 shortcuts.
 */
export function pushNum(value: bigint): Uint8Array {
  const encoded = encodeScriptNum(value);
  return pushData(encoded);
}

/** Emit a single opcode byte. */
export function opcode(op: number): Uint8Array {
  return new Uint8Array([op]);
}
