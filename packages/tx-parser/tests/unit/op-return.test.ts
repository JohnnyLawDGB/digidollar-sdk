import { describe, it, expect } from 'vitest';
import { parseOpReturn } from '../../src/op-return.js';
import { encodeScriptNum } from '../../src/script-num.js';
import { bytesToHex } from '../../src/hex.js';

/**
 * Build a raw OP_RETURN script from parts.
 * Each part is a Uint8Array that will be push-encoded (direct push for len < 0x4c).
 */
function buildScript(...parts: (number | Uint8Array)[]): Uint8Array {
  const chunks: number[] = [];
  for (const part of parts) {
    if (typeof part === 'number') {
      // Non-push opcode (OP_RETURN, etc.)
      chunks.push(part);
    } else {
      // Push data
      if (part.length < 0x4c) {
        chunks.push(part.length);
        chunks.push(...part);
      } else if (part.length <= 0xff) {
        chunks.push(0x4c); // PUSHDATA1
        chunks.push(part.length);
        chunks.push(...part);
      } else {
        chunks.push(0x4d); // PUSHDATA2
        chunks.push(part.length & 0xff);
        chunks.push((part.length >> 8) & 0xff);
        chunks.push(...part);
      }
    }
  }
  return new Uint8Array(chunks);
}

const OP_RETURN = 0x6a;
const DD_MARKER = new Uint8Array([0x44, 0x44]);

describe('parseOpReturn', () => {
  describe('mint', () => {
    it('parses a valid mint OP_RETURN', () => {
      const ownerPubKey = new Uint8Array(32).fill(0xab);
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(1n),     // type = mint
        encodeScriptNum(50000n), // 500 DD in cents
        encodeScriptNum(172800n), // lock height
        encodeScriptNum(2n),     // lock tier
        ownerPubKey,             // 32-byte x-only pubkey
      );

      const result = parseOpReturn(script);
      expect(result).not.toBeNull();
      expect(result!.txType).toBe('mint');
      if (result!.txType === 'mint') {
        expect(result!.ddAmountCents).toBe(50000n);
        expect(result!.lockHeight).toBe(172800n);
        expect(result!.lockTier).toBe(2n);
        expect(result!.ownerPubKey).toEqual(ownerPubKey);
      }
    });

    it('parses mint from hex string', () => {
      const ownerPubKey = new Uint8Array(32).fill(0x01);
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(1n),
        encodeScriptNum(10000n),
        encodeScriptNum(100n),
        encodeScriptNum(0n),
        ownerPubKey,
      );
      const hex = bytesToHex(script);

      const result = parseOpReturn(hex);
      expect(result).not.toBeNull();
      expect(result!.txType).toBe('mint');
      if (result!.txType === 'mint') {
        expect(result!.ddAmountCents).toBe(10000n);
        expect(result!.lockHeight).toBe(100n);
        expect(result!.lockTier).toBe(0n);
      }
    });

    it('returns null if owner pubkey is wrong size', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(1n),
        encodeScriptNum(50000n),
        encodeScriptNum(172800n),
        encodeScriptNum(2n),
        new Uint8Array(16), // 16 bytes, not 32
      );
      expect(parseOpReturn(script)).toBeNull();
    });

    it('returns null if fields are missing', () => {
      // Missing lockTier and pubkey
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(1n),
        encodeScriptNum(50000n),
        encodeScriptNum(172800n),
      );
      expect(parseOpReturn(script)).toBeNull();
    });
  });

  describe('transfer', () => {
    it('parses a transfer with 2 amounts', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(2n),     // type = transfer
        encodeScriptNum(10000n), // 100 DD
        encodeScriptNum(5000n),  // 50 DD
      );

      const result = parseOpReturn(script);
      expect(result).not.toBeNull();
      expect(result!.txType).toBe('transfer');
      if (result!.txType === 'transfer') {
        expect(result!.amounts).toEqual([10000n, 5000n]);
      }
    });

    it('parses a transfer with 1 amount', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(2n),
        encodeScriptNum(25000n),
      );

      const result = parseOpReturn(script);
      expect(result!.txType).toBe('transfer');
      if (result!.txType === 'transfer') {
        expect(result!.amounts).toEqual([25000n]);
      }
    });

    it('parses a transfer with many amounts', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(2n),
        encodeScriptNum(1000n),
        encodeScriptNum(2000n),
        encodeScriptNum(3000n),
        encodeScriptNum(4000n),
      );

      const result = parseOpReturn(script);
      if (result!.txType === 'transfer') {
        expect(result!.amounts).toEqual([1000n, 2000n, 3000n, 4000n]);
      }
    });

    it('returns null for transfer with no amounts', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(2n),
        // no amounts
      );
      expect(parseOpReturn(script)).toBeNull();
    });
  });

  describe('redeem', () => {
    it('parses a valid redeem OP_RETURN', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(3n),     // type = redeem
        encodeScriptNum(25000n), // 250 DD in cents
      );

      const result = parseOpReturn(script);
      expect(result).not.toBeNull();
      expect(result!.txType).toBe('redeem');
      if (result!.txType === 'redeem') {
        expect(result!.ddAmountCents).toBe(25000n);
      }
    });

    it('returns null if amount is missing', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(3n),
        // no amount
      );
      expect(parseOpReturn(script)).toBeNull();
    });
  });

  describe('invalid scripts', () => {
    it('returns null for non-OP_RETURN script', () => {
      // P2TR script (not OP_RETURN)
      const script = new Uint8Array(34);
      script[0] = 0x51; // OP_1
      script[1] = 0x20; // push 32 bytes
      expect(parseOpReturn(script)).toBeNull();
    });

    it('returns null for OP_RETURN without DD marker', () => {
      const script = buildScript(
        OP_RETURN,
        new Uint8Array([0x00, 0x00]), // not "DD"
        encodeScriptNum(1n),
      );
      expect(parseOpReturn(script)).toBeNull();
    });

    it('returns null for OP_RETURN with wrong marker length', () => {
      const script = buildScript(
        OP_RETURN,
        new Uint8Array([0x44, 0x44, 0x44]), // "DDD" — 3 bytes, not 2
        encodeScriptNum(1n),
      );
      expect(parseOpReturn(script)).toBeNull();
    });

    it('returns null for unknown DD type', () => {
      const script = buildScript(
        OP_RETURN,
        DD_MARKER,
        encodeScriptNum(99n), // unknown type
      );
      expect(parseOpReturn(script)).toBeNull();
    });

    it('returns null for empty script', () => {
      expect(parseOpReturn(new Uint8Array([]))).toBeNull();
    });

    it('returns null for bare OP_RETURN', () => {
      expect(parseOpReturn(new Uint8Array([0x6a]))).toBeNull();
    });

    it('returns null for empty hex string', () => {
      expect(parseOpReturn('')).toBeNull();
    });
  });
});
