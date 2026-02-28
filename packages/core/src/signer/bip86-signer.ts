/**
 * BIP-86 Taproot HD signer for DigiByte.
 *
 * Derivation: m/86'/20'/0'/change/index (mainnet)
 *             m/86'/1'/0'/change/index  (testnet/regtest)
 *
 * Coin type 20 = DigiByte (BIP-44 registered).
 * Uses @scure/bip32 HDKey + @noble/curves schnorr for signing.
 */

import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { schnorr } from '@noble/curves/secp256k1';
import { tweakPublicKey, buildTokenP2TR } from '@digidollar/tx-builder';
import type { Signer, SigningContext } from './interface.js';
import { encodeBech32m } from './address.js';
import type { Network } from '../config.js';

const COIN_TYPE: Record<Network, number> = {
  mainnet: 20,
  testnet: 1,
  regtest: 1,
};

export class BIP86Signer implements Signer {
  private readonly masterKey: HDKey;
  private readonly network: Network;
  private readonly accountKey: HDKey;
  private nextExternal = 0;
  private nextInternal = 0;

  private constructor(masterKey: HDKey, network: Network) {
    this.masterKey = masterKey;
    this.network = network;
    // Derive account key: m/86'/coinType'/0'
    const coinType = COIN_TYPE[network];
    this.accountKey = masterKey
      .derive(`m/86'/${coinType}'/0'`);
  }

  /** Create from an existing BIP-39 mnemonic */
  static fromMnemonic(mnemonic: string, network: Network): BIP86Signer {
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid BIP-39 mnemonic');
    }
    const seed = mnemonicToSeedSync(mnemonic);
    const master = HDKey.fromMasterSeed(seed);
    return new BIP86Signer(master, network);
  }

  /** Generate a new random mnemonic and create a signer */
  static generate(network: Network): { signer: BIP86Signer; mnemonic: string } {
    const mnemonic = generateMnemonic(wordlist, 256); // 24 words
    const signer = BIP86Signer.fromMnemonic(mnemonic, network);
    return { signer, mnemonic };
  }

  /** Get the account-level xpub for watch-only export */
  getAccountXpub(): string {
    return this.accountKey.publicExtendedKey;
  }

  /** Get the next unused external (receiving) address and advance the index */
  deriveNextAddress(): { address: string; path: string } {
    const idx = this.nextExternal++;
    const path = `m/86'/${COIN_TYPE[this.network]}'/0'/0/${idx}`;
    const address = encodeBech32m(this.getXOnlyPubKeySync(path), this.network);
    return { address, path };
  }

  /** Get the next unused internal (change) address path */
  deriveNextChangePath(): string {
    const idx = this.nextInternal++;
    return `m/86'/${COIN_TYPE[this.network]}'/0'/1/${idx}`;
  }

  async getPublicKey(derivationPath?: string): Promise<Uint8Array> {
    const path = derivationPath ?? this.getDefaultPath();
    return this.getXOnlyPubKeySync(path);
  }

  async sign(context: SigningContext): Promise<Uint8Array> {
    // Determine which key to use
    const path = context.derivationPath ?? this.findPathForPubKey(context.publicKey);
    const child = this.masterKey.derive(path);
    if (!child.privateKey) {
      throw new Error(`No private key at path ${path}`);
    }
    return schnorr.sign(context.sighash, child.privateKey);
  }

  async getScriptPubKey(derivationPath?: string): Promise<Uint8Array> {
    const xonly = await this.getPublicKey(derivationPath);
    return buildTokenP2TR(xonly);
  }

  async getAddress(derivationPath?: string): Promise<string> {
    const xonly = await this.getPublicKey(derivationPath);
    // Tweak the key for the address (key-path-only, no merkle root)
    const { outputKey } = tweakPublicKey(xonly);
    return encodeBech32m(outputKey, this.network);
  }

  private getDefaultPath(): string {
    return `m/86'/${COIN_TYPE[this.network]}'/0'/0/0`;
  }

  private getXOnlyPubKeySync(path: string): Uint8Array {
    const child = this.masterKey.derive(path);
    if (!child.publicKey) {
      throw new Error(`No public key at path ${path}`);
    }
    // child.publicKey is 33-byte compressed. Extract x-only (drop prefix byte).
    return child.publicKey.slice(1);
  }

  /**
   * Search for a derivation path that produces the given x-only public key.
   * Searches both external and internal chains up to current indices.
   */
  private findPathForPubKey(targetPubKey: Uint8Array): string {
    const coinType = COIN_TYPE[this.network];
    const searchLimit = Math.max(this.nextExternal, this.nextInternal, 1) + 10;

    for (let i = 0; i < searchLimit; i++) {
      // External chain
      const extPath = `m/86'/${coinType}'/0'/0/${i}`;
      const extKey = this.getXOnlyPubKeySync(extPath);
      if (bytesEqual(extKey, targetPubKey)) return extPath;

      // Internal chain
      const intPath = `m/86'/${coinType}'/0'/1/${i}`;
      const intKey = this.getXOnlyPubKeySync(intPath);
      if (bytesEqual(intKey, targetPubKey)) return intPath;
    }

    // Fallback to default path
    return this.getDefaultPath();
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
