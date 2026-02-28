/**
 * BIP-341 x-only public key tweaking.
 *
 * output_key = internal_key + H_TapTweak(internal_key, merkle_root) * G
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { tapTweakHash } from './tagged-hash.js';

const Point = secp256k1.ProjectivePoint;

/**
 * Tweak an x-only public key with an optional merkle root.
 *
 * @param xOnlyPubKey 32-byte x-only public key
 * @param merkleRoot Optional 32-byte merkle root (omit for key-path-only P2TR)
 * @returns The tweaked output key (32 bytes x-only) and its parity
 */
export function tweakPublicKey(
  xOnlyPubKey: Uint8Array,
  merkleRoot?: Uint8Array,
): { outputKey: Uint8Array; parity: number } {
  // Compute tweak scalar: t = H_TapTweak(key [, root])
  const tweakBytes = tapTweakHash(xOnlyPubKey, merkleRoot);

  // Convert tweak to scalar (mod n)
  const tweakScalar = bytesToBigInt(tweakBytes);
  if (tweakScalar === 0n || tweakScalar >= secp256k1.CURVE.n) {
    throw new Error('Invalid tweak scalar');
  }

  // Lift x-only key to a point with even y (BIP-340 convention).
  // Point.fromHex expects 33-byte compressed, so prepend 0x02 (even y).
  const compressed = new Uint8Array(33);
  compressed[0] = 0x02;
  compressed.set(xOnlyPubKey, 1);
  const internalPoint = Point.fromHex(compressed);

  // Compute output point: P + t*G
  const tweakPoint = Point.BASE.multiply(tweakScalar);
  const outputPoint = internalPoint.add(tweakPoint);

  // Get x-only representation and parity
  const outputBytes = outputPoint.toRawBytes(true); // 33 bytes compressed
  const parity = outputBytes[0] === 0x03 ? 1 : 0;
  const outputKey = outputBytes.slice(1); // drop prefix byte to get 32-byte x-only

  return { outputKey, parity };
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]!);
  }
  return result;
}
