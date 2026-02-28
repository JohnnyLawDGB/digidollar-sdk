import { describe, it, expect } from 'vitest';
import { buildKeyPathWitness, buildScriptPathWitness, injectWitness } from '../../src/pipeline/witness.js';
import { TAPSCRIPT_LEAF_VERSION, NUMS_POINT } from '@digidollar/tx-builder';
import type { UnsignedTx } from '@digidollar/tx-builder';

describe('witness construction', () => {
  const fakeSig = new Uint8Array(64).fill(0xaa);
  const fakeLeafScript = new Uint8Array([0xb1, 0x75, 0x20, ...new Array(32).fill(0xbb), 0xac]);
  const fakeSiblingHash = new Uint8Array(32).fill(0xcc);

  describe('buildKeyPathWitness', () => {
    it('should return single-element array with signature', () => {
      const witness = buildKeyPathWitness(fakeSig);
      expect(witness).toHaveLength(1);
      expect(witness[0]).toBe(fakeSig);
    });
  });

  describe('buildScriptPathWitness', () => {
    it('should return [signature, leafScript, controlBlock]', () => {
      const witness = buildScriptPathWitness(fakeSig, fakeLeafScript, fakeSiblingHash, 0);
      expect(witness).toHaveLength(3);
      expect(witness[0]).toBe(fakeSig);
      expect(witness[1]).toBe(fakeLeafScript);
    });

    it('should build correct control block with NUMS internal key', () => {
      const witness = buildScriptPathWitness(fakeSig, fakeLeafScript, fakeSiblingHash, 0);
      const controlBlock = witness[2]!;

      // 65 bytes: 1 byte header + 32 byte internal key + 32 byte sibling hash
      expect(controlBlock.length).toBe(65);

      // Header: leafVersion | parity
      expect(controlBlock[0]).toBe(TAPSCRIPT_LEAF_VERSION | 0);

      // Internal key = NUMS point
      expect(controlBlock.slice(1, 33)).toEqual(NUMS_POINT);

      // Sibling hash
      expect(controlBlock.slice(33, 65)).toEqual(fakeSiblingHash);
    });

    it('should set parity bit correctly', () => {
      const witness0 = buildScriptPathWitness(fakeSig, fakeLeafScript, fakeSiblingHash, 0);
      const witness1 = buildScriptPathWitness(fakeSig, fakeLeafScript, fakeSiblingHash, 1);

      expect(witness0[2]![0]).toBe(TAPSCRIPT_LEAF_VERSION | 0);
      expect(witness1[2]![0]).toBe(TAPSCRIPT_LEAF_VERSION | 1);
    });
  });

  describe('injectWitness', () => {
    it('should inject witness into transaction input', () => {
      const tx: UnsignedTx = {
        version: 2,
        inputs: [
          { txid: 'aa'.repeat(32), vout: 0, scriptSig: new Uint8Array(0), sequence: 0xffffffff, witness: [] },
        ],
        outputs: [],
        locktime: 0,
      };

      const witness = buildKeyPathWitness(fakeSig);
      injectWitness(tx, 0, witness);
      expect(tx.inputs[0]!.witness).toBe(witness);
    });

    it('should throw for invalid input index', () => {
      const tx: UnsignedTx = {
        version: 2,
        inputs: [],
        outputs: [],
        locktime: 0,
      };

      expect(() => injectWitness(tx, 0, [])).toThrow('No input');
    });
  });
});
