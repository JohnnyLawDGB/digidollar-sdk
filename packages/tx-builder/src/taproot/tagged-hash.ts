/**
 * BIP-341 tagged hashes for Taproot construction.
 *
 * H_tag(msg) = SHA256(SHA256(tag) || SHA256(tag) || msg)
 */

import { sha256 } from '@noble/hashes/sha256';
import { TAPSCRIPT_LEAF_VERSION } from '../constants.js';
import { encodeVarint } from '../tx/varint.js';

/** Cache for tag hashes to avoid recomputation */
const tagHashCache = new Map<string, Uint8Array>();

function getTagHash(tag: string): Uint8Array {
  let cached = tagHashCache.get(tag);
  if (cached) return cached;
  cached = sha256(new TextEncoder().encode(tag));
  tagHashCache.set(tag, cached);
  return cached;
}

/** Compute a BIP-340/341 tagged hash: SHA256(SHA256(tag) || SHA256(tag) || msg) */
export function taggedHash(tag: string, ...data: Uint8Array[]): Uint8Array {
  const tagHash = getTagHash(tag);
  let totalLen = 64; // two tag hashes
  for (const d of data) totalLen += d.length;
  const buf = new Uint8Array(totalLen);
  buf.set(tagHash, 0);
  buf.set(tagHash, 32);
  let offset = 64;
  for (const d of data) {
    buf.set(d, offset);
    offset += d.length;
  }
  return sha256(buf);
}

/**
 * BIP-341 TapLeaf hash.
 * H_TapLeaf(leafVersion, script) = SHA256(SHA256("TapLeaf") || SHA256("TapLeaf") || leafVersion || CompactSize(len(script)) || script)
 */
export function tapleafHash(script: Uint8Array, leafVersion: number = TAPSCRIPT_LEAF_VERSION): Uint8Array {
  const compactLen = encodeVarint(script.length);
  const payload = new Uint8Array(1 + compactLen.length + script.length);
  payload[0] = leafVersion;
  payload.set(compactLen, 1);
  payload.set(script, 1 + compactLen.length);
  return taggedHash('TapLeaf', payload);
}

/**
 * BIP-341 TapBranch hash.
 * H_TapBranch(a, b) = SHA256(SHA256("TapBranch") || SHA256("TapBranch") || sorted(a, b))
 * Lexicographic sort ensures deterministic ordering.
 */
export function tapbranchHash(a: Uint8Array, b: Uint8Array): Uint8Array {
  // Lexicographic comparison
  const cmp = compareBytes(a, b);
  const first = cmp <= 0 ? a : b;
  const second = cmp <= 0 ? b : a;
  return taggedHash('TapBranch', first, second);
}

/**
 * BIP-341 TapTweak hash.
 * H_TapTweak(key, root?) = SHA256(SHA256("TapTweak") || SHA256("TapTweak") || key [|| root])
 */
export function tapTweakHash(pubkey: Uint8Array, merkleRoot?: Uint8Array): Uint8Array {
  if (merkleRoot) {
    return taggedHash('TapTweak', pubkey, merkleRoot);
  }
  return taggedHash('TapTweak', pubkey);
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i]! < b[i]!) return -1;
    if (a[i]! > b[i]!) return 1;
  }
  return a.length - b.length;
}
