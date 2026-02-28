import { describe, it, expect } from 'vitest';
import { encodeVarint } from '../../src/tx/varint.js';

describe('encodeVarint', () => {
  it('encodes 0 as single byte', () => {
    expect(encodeVarint(0)).toEqual(new Uint8Array([0x00]));
  });

  it('encodes values < 0xFD as single byte', () => {
    expect(encodeVarint(1)).toEqual(new Uint8Array([0x01]));
    expect(encodeVarint(252)).toEqual(new Uint8Array([0xfc]));
  });

  it('encodes 0xFD-0xFFFF as 3 bytes', () => {
    expect(encodeVarint(253)).toEqual(new Uint8Array([0xfd, 0xfd, 0x00]));
    expect(encodeVarint(0xffff)).toEqual(new Uint8Array([0xfd, 0xff, 0xff]));
  });

  it('encodes 0x10000-0xFFFFFFFF as 5 bytes', () => {
    expect(encodeVarint(0x10000)).toEqual(new Uint8Array([0xfe, 0x00, 0x00, 0x01, 0x00]));
    expect(encodeVarint(0xffffffff)).toEqual(new Uint8Array([0xfe, 0xff, 0xff, 0xff, 0xff]));
  });

  it('rejects negative values', () => {
    expect(() => encodeVarint(-1)).toThrow();
  });

  it('encodes 300 correctly', () => {
    // 300 = 0x012C → 0xFD 0x2C 0x01
    expect(encodeVarint(300)).toEqual(new Uint8Array([0xfd, 0x2c, 0x01]));
  });
});
