import { describe, it, expect } from 'vitest';
import { BIP86Signer } from '../../src/signer/bip86-signer.js';
import { decodeBech32m } from '../../src/signer/address.js';

// Known test mnemonic (DO NOT USE FOR REAL FUNDS)
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

describe('BIP86Signer', () => {
  describe('fromMnemonic', () => {
    it('should create signer from valid mnemonic', () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'mainnet');
      expect(signer).toBeInstanceOf(BIP86Signer);
    });

    it('should reject invalid mnemonic', () => {
      expect(() => BIP86Signer.fromMnemonic('invalid words here', 'mainnet')).toThrow('Invalid');
    });
  });

  describe('generate', () => {
    it('should create new signer with 24-word mnemonic', () => {
      const { signer, mnemonic } = BIP86Signer.generate('testnet');
      expect(signer).toBeInstanceOf(BIP86Signer);
      expect(mnemonic.split(' ').length).toBe(24);
    });
  });

  describe('getPublicKey', () => {
    it('should return 32-byte x-only public key', async () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const pubkey = await signer.getPublicKey();
      expect(pubkey.length).toBe(32);
    });

    it('should return deterministic keys from same mnemonic', async () => {
      const signer1 = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const signer2 = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const pub1 = await signer1.getPublicKey();
      const pub2 = await signer2.getPublicKey();
      expect(pub1).toEqual(pub2);
    });

    it('should derive different keys for different paths', async () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const pub0 = await signer.getPublicKey("m/86'/1'/0'/0/0");
      const pub1 = await signer.getPublicKey("m/86'/1'/0'/0/1");
      expect(pub0).not.toEqual(pub1);
    });

    it('should derive different keys for mainnet vs testnet', async () => {
      const signerMain = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'mainnet');
      const signerTest = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const pubMain = await signerMain.getPublicKey();
      const pubTest = await signerTest.getPublicKey();
      expect(pubMain).not.toEqual(pubTest); // cointype 20 vs 1
    });
  });

  describe('getAddress', () => {
    it('should return valid bech32m address for testnet', async () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const addr = await signer.getAddress();
      expect(addr).toMatch(/^dgbt1p/);
      // Should be decodable
      const { network } = decodeBech32m(addr);
      expect(network).toBe('testnet');
    });

    it('should return valid bech32m address for mainnet', async () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'mainnet');
      const addr = await signer.getAddress();
      expect(addr).toMatch(/^dgb1p/);
    });
  });

  describe('getScriptPubKey', () => {
    it('should return 34-byte P2TR scriptPubKey', async () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const spk = await signer.getScriptPubKey();
      expect(spk.length).toBe(34);
      expect(spk[0]).toBe(0x51); // OP_1
      expect(spk[1]).toBe(0x20); // push 32 bytes
    });
  });

  describe('sign', () => {
    it('should produce 64-byte Schnorr signature', async () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const pubkey = await signer.getPublicKey();
      const fakeSighash = new Uint8Array(32).fill(0x42);

      const sig = await signer.sign({
        inputIndex: 0,
        sighash: fakeSighash,
        publicKey: pubkey,
        isScriptPath: false,
      });

      expect(sig.length).toBe(64);
    });

    it('should produce valid verifiable signature', async () => {
      const { schnorr } = await import('@noble/curves/secp256k1');
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const pubkey = await signer.getPublicKey();
      const msg = new Uint8Array(32).fill(0x99);

      const sig = await signer.sign({
        inputIndex: 0,
        sighash: msg,
        publicKey: pubkey,
        isScriptPath: false,
      });

      expect(schnorr.verify(sig, msg, pubkey)).toBe(true);
    });
  });

  describe('deriveNextAddress', () => {
    it('should derive sequential addresses', () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const a0 = signer.deriveNextAddress();
      const a1 = signer.deriveNextAddress();
      expect(a0.path).toContain('/0/0');
      expect(a1.path).toContain('/0/1');
      expect(a0.address).not.toBe(a1.address);
    });
  });

  describe('getAccountXpub', () => {
    it('should return xpub string', () => {
      const signer = BIP86Signer.fromMnemonic(TEST_MNEMONIC, 'testnet');
      const xpub = signer.getAccountXpub();
      expect(xpub).toMatch(/^xpub/);
    });
  });
});
