import { describe, it, expect } from 'vitest';
import { encodeBech32m, decodeBech32m, getHRP } from '../../src/signer/address.js';

describe('address', () => {
  // A known 32-byte x-only pubkey (all zeros for simplicity)
  const dummyPubKey = new Uint8Array(32);
  dummyPubKey.fill(0xab);

  describe('encodeBech32m', () => {
    it('should encode mainnet address with dgb prefix', () => {
      const addr = encodeBech32m(dummyPubKey, 'mainnet');
      expect(addr).toMatch(/^dgb1p/);
    });

    it('should encode testnet address with dgbt prefix', () => {
      const addr = encodeBech32m(dummyPubKey, 'testnet');
      expect(addr).toMatch(/^dgbt1p/);
    });

    it('should encode regtest address with dgbrt prefix', () => {
      const addr = encodeBech32m(dummyPubKey, 'regtest');
      expect(addr).toMatch(/^dgbrt1p/);
    });

    it('should reject non-32-byte keys', () => {
      expect(() => encodeBech32m(new Uint8Array(31), 'mainnet')).toThrow('32-byte');
      expect(() => encodeBech32m(new Uint8Array(33), 'mainnet')).toThrow('32-byte');
    });
  });

  describe('decodeBech32m', () => {
    it('should roundtrip mainnet address', () => {
      const addr = encodeBech32m(dummyPubKey, 'mainnet');
      const { program, network } = decodeBech32m(addr);
      expect(network).toBe('mainnet');
      expect(program).toEqual(dummyPubKey);
    });

    it('should roundtrip testnet address', () => {
      const addr = encodeBech32m(dummyPubKey, 'testnet');
      const { program, network } = decodeBech32m(addr);
      expect(network).toBe('testnet');
      expect(program).toEqual(dummyPubKey);
    });

    it('should roundtrip regtest address', () => {
      const addr = encodeBech32m(dummyPubKey, 'regtest');
      const { program, network } = decodeBech32m(addr);
      expect(network).toBe('regtest');
      expect(program).toEqual(dummyPubKey);
    });

    it('should reject invalid addresses', () => {
      expect(() => decodeBech32m('not-an-address')).toThrow();
    });

    it('should reject unknown HRP', () => {
      // A valid bech32m with unknown prefix
      expect(() => decodeBech32m('bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx')).toThrow();
    });
  });

  describe('getHRP', () => {
    it('should return correct HRP per network', () => {
      expect(getHRP('mainnet')).toBe('dgb');
      expect(getHRP('testnet')).toBe('dgbt');
      expect(getHRP('regtest')).toBe('dgbrt');
    });
  });

  describe('encode → decode → encode roundtrip', () => {
    it('should produce identical addresses', () => {
      for (const network of ['mainnet', 'testnet', 'regtest'] as const) {
        const addr1 = encodeBech32m(dummyPubKey, network);
        const { program } = decodeBech32m(addr1);
        const addr2 = encodeBech32m(program, network);
        expect(addr2).toBe(addr1);
      }
    });
  });
});
