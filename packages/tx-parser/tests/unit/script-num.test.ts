import { describe, it, expect } from 'vitest';
import { decodeScriptNum, encodeScriptNum } from '../../src/script-num.js';
import { ScriptNumError } from '../../src/errors.js';

describe('decodeScriptNum', () => {
  it('decodes empty bytes to 0', () => {
    expect(decodeScriptNum(new Uint8Array([]))).toBe(0n);
  });

  it('decodes [0x01] to 1', () => {
    expect(decodeScriptNum(new Uint8Array([0x01]))).toBe(1n);
  });

  it('decodes [0x02] to 2', () => {
    expect(decodeScriptNum(new Uint8Array([0x02]))).toBe(2n);
  });

  it('decodes [0x7f] to 127', () => {
    expect(decodeScriptNum(new Uint8Array([0x7f]))).toBe(127n);
  });

  it('decodes [0x80, 0x00] to 128 (needs extra byte for sign)', () => {
    expect(decodeScriptNum(new Uint8Array([0x80, 0x00]))).toBe(128n);
  });

  it('decodes [0xff, 0x00] to 255', () => {
    expect(decodeScriptNum(new Uint8Array([0xff, 0x00]))).toBe(255n);
  });

  it('decodes [0x00, 0x01] to 256', () => {
    expect(decodeScriptNum(new Uint8Array([0x00, 0x01]))).toBe(256n);
  });

  it('decodes negative: [0x81] to -1', () => {
    expect(decodeScriptNum(new Uint8Array([0x81]))).toBe(-1n);
  });

  it('decodes negative: [0xff] to -127', () => {
    expect(decodeScriptNum(new Uint8Array([0xff]))).toBe(-127n);
  });

  it('decodes negative: [0x80, 0x80] to -128', () => {
    expect(decodeScriptNum(new Uint8Array([0x80, 0x80]))).toBe(-128n);
  });

  it('throws on overflow (exceeds maxNumSize)', () => {
    const nineBytes = new Uint8Array(9);
    expect(() => decodeScriptNum(nineBytes)).toThrow(ScriptNumError);
  });

  it('respects custom maxNumSize', () => {
    const fiveBytes = new Uint8Array(5);
    expect(() => decodeScriptNum(fiveBytes, 4)).toThrow(ScriptNumError);
    expect(decodeScriptNum(fiveBytes, 5)).toBe(0n); // all zeros = 0 sign bit not set
  });
});

describe('encodeScriptNum', () => {
  it('encodes 0 to empty array', () => {
    expect(encodeScriptNum(0n)).toEqual(new Uint8Array([]));
  });

  it('encodes 1 to [0x01]', () => {
    expect(encodeScriptNum(1n)).toEqual(new Uint8Array([0x01]));
  });

  it('encodes 127 to [0x7f]', () => {
    expect(encodeScriptNum(127n)).toEqual(new Uint8Array([0x7f]));
  });

  it('encodes 128 to [0x80, 0x00]', () => {
    expect(encodeScriptNum(128n)).toEqual(new Uint8Array([0x80, 0x00]));
  });

  it('encodes 255 to [0xff, 0x00]', () => {
    expect(encodeScriptNum(255n)).toEqual(new Uint8Array([0xff, 0x00]));
  });

  it('encodes 256 to [0x00, 0x01]', () => {
    expect(encodeScriptNum(256n)).toEqual(new Uint8Array([0x00, 0x01]));
  });

  it('encodes -1 to [0x81]', () => {
    expect(encodeScriptNum(-1n)).toEqual(new Uint8Array([0x81]));
  });

  it('encodes -127 to [0xff]', () => {
    expect(encodeScriptNum(-127n)).toEqual(new Uint8Array([0xff]));
  });

  it('encodes -128 to [0x80, 0x80]', () => {
    expect(encodeScriptNum(-128n)).toEqual(new Uint8Array([0x80, 0x80]));
  });
});

describe('round-trip', () => {
  const testValues = [
    0n, 1n, -1n, 127n, 128n, -128n, 255n, 256n, -256n,
    // DD-relevant values
    10000n,     // 100 DD (cents)
    50000n,     // 500 DD (cents)
    100000n,    // 1000 DD
    172800n,    // Lock height (~30 days of blocks)
    2073600n,   // Lock height (~360 days)
    21024000n,  // Max lock height (~10 years)
    // Lock tiers
    0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n,
    // Edge cases
    -32768n, 32767n, 65535n, 2147483647n,
    // Large DD amounts
    10000000n,  // $100,000 (max single transfer)
    100000000000n, // Extremely large amount
  ];

  for (const value of testValues) {
    it(`round-trips ${value}`, () => {
      const encoded = encodeScriptNum(value);
      const decoded = decodeScriptNum(encoded);
      expect(decoded).toBe(value);
    });
  }
});
