/**
 * CScriptNum encoder/decoder — ported from Bitcoin Core's script/script.h:230-405.
 *
 * Uses bigint to handle the full int64_t range without overflow.
 * This is the most safety-critical code in the parser: incorrect decoding
 * could misinterpret DD amounts, lock heights, or lock tiers.
 */

import { ScriptNumError } from './errors.js';

/**
 * Decode a CScriptNum-encoded byte array to bigint.
 * Port of CScriptNum::set_vch().
 *
 * Encoding: little-endian magnitude with sign bit in MSB of last byte.
 * - Empty array → 0
 * - MSB of last byte & 0x80 → negative (sign bit), remaining bits are magnitude
 */
export function decodeScriptNum(bytes: Uint8Array, maxNumSize = 8): bigint {
  if (bytes.length === 0) return 0n;

  if (bytes.length > maxNumSize) {
    throw new ScriptNumError(`Script number overflow: ${bytes.length} bytes exceeds max ${maxNumSize}`);
  }

  // Assemble little-endian value
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result |= BigInt(bytes[i]!) << BigInt(8 * i);
  }

  // Check sign bit (MSB of last byte)
  const lastByte = bytes[bytes.length - 1]!;
  if (lastByte & 0x80) {
    // Clear the sign bit and negate
    const signBitMask = 0x80n << BigInt(8 * (bytes.length - 1));
    return -(result & ~signBitMask);
  }

  return result;
}

/**
 * Encode a bigint to CScriptNum byte array.
 * Port of CScriptNum::serialize().
 *
 * Produces minimally-encoded little-endian representation with sign bit.
 */
export function encodeScriptNum(value: bigint): Uint8Array {
  if (value === 0n) return new Uint8Array(0);

  const neg = value < 0n;
  let absvalue = neg ? -value : value;

  const result: number[] = [];
  while (absvalue > 0n) {
    result.push(Number(absvalue & 0xFFn));
    absvalue >>= 8n;
  }

  // Handle sign bit
  const lastIdx = result.length - 1;
  if (result[lastIdx]! & 0x80) {
    // MSB has bit 7 set — would conflict with sign, add extra byte
    result.push(neg ? 0x80 : 0x00);
  } else if (neg) {
    // Set sign bit in existing MSB
    result[lastIdx] = result[lastIdx]! | 0x80;
  }

  return new Uint8Array(result);
}
