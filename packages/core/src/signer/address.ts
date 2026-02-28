/**
 * DigiByte bech32m address encoding/decoding for P2TR (Taproot).
 *
 * Witness version 1, 32-byte program (x-only tweaked pubkey).
 * HRP: dgb (mainnet), dgbt (testnet), dgbrt (regtest)
 */

import { bech32m } from '@scure/base';
import { AddressError } from '../errors.js';
import type { Network } from '../config.js';

const HRP_MAP: Record<Network, string> = {
  mainnet: 'dgb',
  testnet: 'dgbt',
  regtest: 'dgbrt',
};

const HRP_TO_NETWORK = new Map<string, Network>([
  ['dgb', 'mainnet'],
  ['dgbt', 'testnet'],
  ['dgbrt', 'regtest'],
]);

/** Witness version for Taproot */
const WITNESS_VERSION = 1;

/**
 * Encode a 32-byte x-only public key as a DigiByte bech32m P2TR address.
 */
export function encodeBech32m(xOnlyPubKey: Uint8Array, network: Network): string {
  if (xOnlyPubKey.length !== 32) {
    throw new AddressError(`Expected 32-byte x-only pubkey, got ${xOnlyPubKey.length} bytes`);
  }
  const hrp = HRP_MAP[network];
  const words = bech32m.toWords(xOnlyPubKey);
  // Prepend witness version
  words.unshift(WITNESS_VERSION);
  return bech32m.encode(hrp, words);
}

/**
 * Decode a DigiByte bech32m P2TR address.
 * Returns the 32-byte witness program (x-only tweaked pubkey) and network.
 */
export function decodeBech32m(address: string): { program: Uint8Array; network: Network } {
  let decoded: ReturnType<typeof bech32m.decode>;
  try {
    decoded = bech32m.decode(address as `${string}1${string}`);
  } catch {
    throw new AddressError(`Invalid bech32m address: ${address}`);
  }

  const network = HRP_TO_NETWORK.get(decoded.prefix);
  if (!network) {
    throw new AddressError(`Unknown HRP '${decoded.prefix}' — expected dgb, dgbt, or dgbrt`);
  }

  if (decoded.words.length === 0 || decoded.words[0] !== WITNESS_VERSION) {
    throw new AddressError(`Expected witness version ${WITNESS_VERSION}, got ${decoded.words[0]}`);
  }

  const program = bech32m.fromWords(decoded.words.slice(1));
  if (program.length !== 32) {
    throw new AddressError(`Expected 32-byte witness program, got ${program.length} bytes`);
  }

  return { program: Uint8Array.from(program), network };
}

/** Get the HRP for a network */
export function getHRP(network: Network): string {
  return HRP_MAP[network];
}
