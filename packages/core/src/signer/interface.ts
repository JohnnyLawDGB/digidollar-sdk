/** Context provided to the signer for each input that needs signing */
export interface SigningContext {
  /** Index of the input being signed */
  inputIndex: number;
  /** Pre-computed 32-byte BIP-341 sighash */
  sighash: Uint8Array;
  /** 32-byte x-only public key expected to produce the signature */
  publicKey: Uint8Array;
  /** Whether this is a script-path spend (collateral) vs key-path spend */
  isScriptPath: boolean;
  /** BIP-32 derivation path hint for HD signers */
  derivationPath?: string;
}

/**
 * Pluggable signing interface.
 * Default: BIP86Signer (in-memory HD).
 * Users can implement for hardware wallets, KMS, etc.
 */
export interface Signer {
  /** Get the x-only public key (32 bytes) for a derivation path */
  getPublicKey(derivationPath?: string): Promise<Uint8Array>;

  /** Sign a sighash, returning a 64-byte Schnorr signature */
  sign(context: SigningContext): Promise<Uint8Array>;

  /** Get the P2TR scriptPubKey (34 bytes) for a derivation path */
  getScriptPubKey(derivationPath?: string): Promise<Uint8Array>;

  /** Get the bech32m address for a derivation path */
  getAddress(derivationPath?: string): Promise<string>;
}
