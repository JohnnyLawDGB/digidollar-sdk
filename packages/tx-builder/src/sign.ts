/**
 * Optional Schnorr signing helper.
 *
 * Uses @noble/curves secp256k1 for BIP-340 Schnorr signatures.
 * This is a convenience — users can sign with any Schnorr implementation.
 */

import { schnorr } from '@noble/curves/secp256k1';

/**
 * Sign a transaction hash with a private key using BIP-340 Schnorr.
 *
 * @param txHash 32-byte hash to sign (e.g. sighash)
 * @param privateKey 32-byte private key
 * @returns 64-byte Schnorr signature
 */
export function signSchnorr(txHash: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return schnorr.sign(txHash, privateKey);
}

/**
 * Verify a BIP-340 Schnorr signature.
 *
 * @param signature 64-byte Schnorr signature
 * @param txHash 32-byte hash that was signed
 * @param publicKey 32-byte x-only public key
 * @returns true if signature is valid
 */
export function verifySchnorr(signature: Uint8Array, txHash: Uint8Array, publicKey: Uint8Array): boolean {
  return schnorr.verify(signature, txHash, publicKey);
}
