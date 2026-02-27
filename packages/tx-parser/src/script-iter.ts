/**
 * Script opcode iterator — ported from Bitcoin Core's script/script.cpp GetScriptOp.
 *
 * Generator that yields {opcode, data} pairs from a raw script byte array.
 * Handles direct push (0x01-0x4b), OP_0, PUSHDATA1/2/4.
 */

import { ScriptParseError } from './errors.js';
import { OP_PUSHDATA1, OP_PUSHDATA2, OP_PUSHDATA4 } from './types/constants.js';

/** A single parsed script operation */
export interface ScriptOp {
  /** The opcode byte */
  opcode: number;
  /** Push data (present for opcodes 0x00-0x4e, absent for non-push opcodes) */
  data?: Uint8Array;
}

/**
 * Iterate over opcodes in a raw script.
 * Throws ScriptParseError on truncated scripts.
 */
export function* iterScript(script: Uint8Array): Generator<ScriptOp> {
  let pos = 0;

  while (pos < script.length) {
    const opcode = script[pos]!;
    pos++;

    // Push data opcodes: 0x00 through 0x4e (OP_PUSHDATA4)
    if (opcode <= OP_PUSHDATA4) {
      let size: number;

      if (opcode < OP_PUSHDATA1) {
        // Direct push: opcode IS the byte count (0x00 = push 0 bytes, 0x01 = push 1 byte, etc.)
        size = opcode;
      } else if (opcode === OP_PUSHDATA1) {
        if (pos >= script.length) {
          throw new ScriptParseError('Unexpected end of script reading PUSHDATA1 size');
        }
        size = script[pos]!;
        pos++;
      } else if (opcode === OP_PUSHDATA2) {
        if (pos + 2 > script.length) {
          throw new ScriptParseError('Unexpected end of script reading PUSHDATA2 size');
        }
        size = script[pos]! | (script[pos + 1]! << 8);
        pos += 2;
      } else {
        // OP_PUSHDATA4
        if (pos + 4 > script.length) {
          throw new ScriptParseError('Unexpected end of script reading PUSHDATA4 size');
        }
        size = (script[pos]! | (script[pos + 1]! << 8) | (script[pos + 2]! << 16) | (script[pos + 3]! << 24)) >>> 0;
        pos += 4;
      }

      if (pos + size > script.length) {
        throw new ScriptParseError(`Unexpected end of script reading ${size} bytes of push data`);
      }

      yield { opcode, data: script.slice(pos, pos + size) };
      pos += size;
    } else {
      // Non-push opcode (OP_RETURN, OP_1, etc.)
      yield { opcode };
    }
  }
}
