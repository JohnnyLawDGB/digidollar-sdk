/**
 * Shared test keys derived from known private keys using BIP-340 Schnorr.
 * These are valid secp256k1 x-only public keys for use in tests.
 */
import { schnorr } from '@noble/curves/secp256k1';

// Private keys (32 bytes each, never use in production)
const priv1 = new Uint8Array(32);
priv1[31] = 0x01;

const priv2 = new Uint8Array(32);
priv2[31] = 0x02;

const priv3 = new Uint8Array(32);
priv3[31] = 0x03;

const priv4 = new Uint8Array(32);
priv4[31] = 0x04;

/** Owner key — valid x-only pubkey derived from private key 0x01 */
export const ownerKey = schnorr.getPublicKey(priv1);

/** Spender key — valid x-only pubkey derived from private key 0x02 */
export const spenderKey = schnorr.getPublicKey(priv2);

/** Recipient key A — valid x-only pubkey derived from private key 0x03 */
export const recipientKeyA = schnorr.getPublicKey(priv3);

/** Recipient key B — valid x-only pubkey derived from private key 0x04 */
export const recipientKeyB = schnorr.getPublicKey(priv4);

/** A valid P2TR scriptPubKey for change destinations */
export const changeDest = '5120' + Buffer.from(ownerKey).toString('hex');
export const collateralDest = '5120' + Buffer.from(spenderKey).toString('hex');
