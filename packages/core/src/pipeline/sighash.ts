/**
 * BIP-341 Taproot sighash computation.
 *
 * TapSighash = taggedHash("TapSighash",
 *   0x00 ||                          // epoch
 *   sighash_type (1) ||              // 0x00 = SIGHASH_DEFAULT
 *   nVersion (4 LE) ||
 *   nLockTime (4 LE) ||
 *   sha256(all prevout outpoints) ||
 *   sha256(all prevout amounts) ||
 *   sha256(all prevout scriptPubKeys) ||
 *   sha256(all input sequences) ||
 *   sha256(all outputs) ||
 *   spend_type (1) ||                // 0x00 key-path, 0x01 script-path (ext_flag)
 *   input_index (4 LE) ||
 *   [if script-path: leafHash (32) || key_version (1=0x00) || codesep_pos (4=0xFFFFFFFF)]
 * )
 */

import { sha256 } from '@noble/hashes/sha256';
import { taggedHash } from '@digidollar/tx-builder';
import { hexToBytes } from '@digidollar/tx-parser';
import type { UnsignedTx } from '@digidollar/tx-builder';

/** Prevout info needed for sighash computation */
export interface PrevoutData {
  txid: string;
  vout: number;
  /** Value in satoshis */
  value: bigint;
  /** scriptPubKey hex */
  scriptPubKey: string;
}

/** Options for computing a Taproot sighash */
export interface SighashOptions {
  /** The unsigned transaction */
  tx: UnsignedTx;
  /** Index of the input being signed */
  inputIndex: number;
  /** Prevout data for ALL inputs (same order as tx.inputs) */
  prevouts: PrevoutData[];
  /** Sighash type (0x00 = SIGHASH_DEFAULT) */
  sighashType?: number;
  /** For script-path spends: the tapleaf hash */
  leafHash?: Uint8Array;
}

/**
 * Compute a BIP-341 Taproot sighash.
 */
export function computeTaprootSighash(opts: SighashOptions): Uint8Array {
  const { tx, inputIndex, prevouts, leafHash } = opts;
  const sighashType = opts.sighashType ?? 0x00;
  const isScriptPath = leafHash !== undefined;
  const spendType = isScriptPath ? 0x01 : 0x00;

  // Precompute shared hashes
  const hashPrevouts = sha256(serializeAllPrevouts(prevouts));
  const hashAmounts = sha256(serializeAllAmounts(prevouts));
  const hashScriptPubKeys = sha256(serializeAllScriptPubKeys(prevouts));
  const hashSequences = sha256(serializeAllSequences(tx));
  const hashOutputs = sha256(serializeAllOutputs(tx));

  // Build the sighash preimage
  const parts: Uint8Array[] = [];

  // Epoch (1 byte)
  parts.push(new Uint8Array([0x00]));
  // Sighash type (1 byte)
  parts.push(new Uint8Array([sighashType]));
  // nVersion (4 bytes LE, signed int32)
  parts.push(writeInt32LE(tx.version));
  // nLockTime (4 bytes LE)
  parts.push(writeUint32LE(tx.locktime));
  // sha256(prevouts)
  parts.push(hashPrevouts);
  // sha256(amounts)
  parts.push(hashAmounts);
  // sha256(scriptPubKeys)
  parts.push(hashScriptPubKeys);
  // sha256(sequences)
  parts.push(hashSequences);
  // sha256(outputs)
  parts.push(hashOutputs);
  // spend_type (1 byte)
  parts.push(new Uint8Array([spendType]));
  // input_index (4 bytes LE)
  parts.push(writeUint32LE(inputIndex));

  // Script-path extension
  if (isScriptPath && leafHash) {
    parts.push(leafHash);                            // leafHash (32 bytes)
    parts.push(new Uint8Array([0x00]));              // key_version
    parts.push(writeUint32LE(0xFFFFFFFF));           // codesep_pos (-1)
  }

  return taggedHash('TapSighash', concat(parts));
}

// --- Serialization helpers ---

function serializeAllPrevouts(prevouts: PrevoutData[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const p of prevouts) {
    parts.push(reversedHexToBytes(p.txid)); // 32 bytes, internal byte order
    parts.push(writeUint32LE(p.vout));      // 4 bytes LE
  }
  return concat(parts);
}

function serializeAllAmounts(prevouts: PrevoutData[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const p of prevouts) {
    parts.push(writeInt64LE(p.value));
  }
  return concat(parts);
}

function serializeAllScriptPubKeys(prevouts: PrevoutData[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const p of prevouts) {
    const spk = hexToBytes(p.scriptPubKey);
    // CompactSize length prefix + scriptPubKey
    parts.push(writeCompactSize(spk.length));
    parts.push(spk);
  }
  return concat(parts);
}

function serializeAllSequences(tx: UnsignedTx): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const input of tx.inputs) {
    parts.push(writeUint32LE(input.sequence));
  }
  return concat(parts);
}

function serializeAllOutputs(tx: UnsignedTx): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const output of tx.outputs) {
    parts.push(writeInt64LE(output.value));
    parts.push(writeCompactSize(output.scriptPubKey.length));
    parts.push(output.scriptPubKey);
  }
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

function writeCompactSize(n: number): Uint8Array {
  if (n < 0xfd) return new Uint8Array([n]);
  if (n <= 0xffff) {
    const buf = new Uint8Array(3);
    buf[0] = 0xfd;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    return buf;
  }
  const buf = new Uint8Array(5);
  buf[0] = 0xfe;
  const view = new DataView(buf.buffer);
  view.setUint32(1, n, true);
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
