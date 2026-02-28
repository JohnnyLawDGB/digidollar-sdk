/**
 * SegWit transaction serialization.
 *
 * Full format (with witness):
 *   version (4 LE) | marker (0x00) | flag (0x01) | vin_count | vins | vout_count | vouts | witnesses | locktime (4 LE)
 *
 * Non-witness format (for txid):
 *   version (4 LE) | vin_count | vins | vout_count | vouts | locktime (4 LE)
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@digidollar/tx-parser';
import { encodeVarint } from './varint.js';
import type { UnsignedTx } from '../types.js';

/**
 * Serialize a transaction in full SegWit format (with witness marker/flag).
 * This is the format used for broadcast.
 */
export function serializeTransaction(tx: UnsignedTx): Uint8Array {
  const hasWitness = tx.inputs.some(input => input.witness.length > 0);
  const parts: Uint8Array[] = [];

  // Version (4 bytes LE — signed int32)
  parts.push(writeInt32LE(tx.version));

  // Witness marker + flag
  if (hasWitness) {
    parts.push(new Uint8Array([0x00, 0x01]));
  }

  // Input count + inputs
  parts.push(encodeVarint(tx.inputs.length));
  for (const input of tx.inputs) {
    parts.push(serializeInput(input));
  }

  // Output count + outputs
  parts.push(encodeVarint(tx.outputs.length));
  for (const output of tx.outputs) {
    parts.push(serializeOutput(output));
  }

  // Witness data (if present)
  if (hasWitness) {
    for (const input of tx.inputs) {
      parts.push(encodeVarint(input.witness.length));
      for (const item of input.witness) {
        parts.push(encodeVarint(item.length));
        parts.push(item);
      }
    }
  }

  // Locktime (4 bytes LE)
  parts.push(writeUint32LE(tx.locktime));

  return concat(parts);
}

/**
 * Serialize a transaction without witness data (for computing txid).
 * txid = reversed double-SHA256 of this serialization.
 */
export function serializeForTxid(tx: UnsignedTx): Uint8Array {
  const parts: Uint8Array[] = [];

  // Version (4 bytes LE — signed int32)
  parts.push(writeInt32LE(tx.version));

  // Input count + inputs
  parts.push(encodeVarint(tx.inputs.length));
  for (const input of tx.inputs) {
    parts.push(serializeInput(input));
  }

  // Output count + outputs
  parts.push(encodeVarint(tx.outputs.length));
  for (const output of tx.outputs) {
    parts.push(serializeOutput(output));
  }

  // Locktime (4 bytes LE)
  parts.push(writeUint32LE(tx.locktime));

  return concat(parts);
}

/** Compute the txid from a transaction (double-SHA256 of non-witness, reversed). */
export function computeTxid(tx: UnsignedTx): string {
  const raw = serializeForTxid(tx);
  const hash = sha256(sha256(raw));
  // Reverse for display (Bitcoin convention)
  const reversed = new Uint8Array(hash.length);
  for (let i = 0; i < hash.length; i++) {
    reversed[i] = hash[hash.length - 1 - i]!;
  }
  return bytesToHex(reversed);
}

function serializeInput(input: { txid: string; vout: number; scriptSig: Uint8Array; sequence: number }): Uint8Array {
  const parts: Uint8Array[] = [];
  // Previous txid (32 bytes, internal byte order = reversed hex)
  parts.push(reversedHexToBytes(input.txid));
  // Previous output index (4 bytes LE)
  parts.push(writeUint32LE(input.vout));
  // Script length + scriptSig
  parts.push(encodeVarint(input.scriptSig.length));
  parts.push(input.scriptSig);
  // Sequence (4 bytes LE)
  parts.push(writeUint32LE(input.sequence));
  return concat(parts);
}

function serializeOutput(output: { value: bigint; scriptPubKey: Uint8Array }): Uint8Array {
  const parts: Uint8Array[] = [];
  // Value (8 bytes LE, signed int64 — but always non-negative)
  parts.push(writeInt64LE(output.value));
  // Script length + scriptPubKey
  parts.push(encodeVarint(output.scriptPubKey.length));
  parts.push(output.scriptPubKey);
  return concat(parts);
}

function writeInt32LE(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  const view = new DataView(buf.buffer);
  view.setInt32(0, n, true);
  return buf;
}

function writeUint32LE(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  const view = new DataView(buf.buffer);
  view.setUint32(0, n >>> 0, true);
  return buf;
}

function writeInt64LE(n: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigInt64(0, n, true);
  return buf;
}

function reversedHexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[bytes.length - 1 - i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
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
