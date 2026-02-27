import { describe, it, expect } from 'vitest';
import { iterScript } from '../../src/script-iter.js';
import { ScriptParseError } from '../../src/errors.js';

function collect(script: Uint8Array) {
  return [...iterScript(script)];
}

describe('iterScript', () => {
  it('parses empty script', () => {
    expect(collect(new Uint8Array([]))).toEqual([]);
  });

  it('parses OP_0 (push 0 bytes)', () => {
    const ops = collect(new Uint8Array([0x00]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x00);
    expect(ops[0].data).toEqual(new Uint8Array([]));
  });

  it('parses direct push of 1 byte', () => {
    const ops = collect(new Uint8Array([0x01, 0xab]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x01);
    expect(ops[0].data).toEqual(new Uint8Array([0xab]));
  });

  it('parses direct push of 2 bytes ("DD")', () => {
    const ops = collect(new Uint8Array([0x02, 0x44, 0x44]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x02);
    expect(ops[0].data).toEqual(new Uint8Array([0x44, 0x44]));
  });

  it('parses direct push of 32 bytes (x-only pubkey)', () => {
    const pubkey = new Uint8Array(32).fill(0xaa);
    const script = new Uint8Array([0x20, ...pubkey]);
    const ops = collect(script);
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x20);
    expect(ops[0].data).toEqual(pubkey);
  });

  it('parses non-push opcode (OP_RETURN = 0x6a)', () => {
    const ops = collect(new Uint8Array([0x6a]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x6a);
    expect(ops[0].data).toBeUndefined();
  });

  it('parses OP_1 (0x51) as non-push', () => {
    const ops = collect(new Uint8Array([0x51]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x51);
    expect(ops[0].data).toBeUndefined();
  });

  it('parses OP_RETURN followed by push data', () => {
    // OP_RETURN "DD"
    const ops = collect(new Uint8Array([0x6a, 0x02, 0x44, 0x44]));
    expect(ops).toHaveLength(2);
    expect(ops[0].opcode).toBe(0x6a);
    expect(ops[1].data).toEqual(new Uint8Array([0x44, 0x44]));
  });

  it('parses PUSHDATA1', () => {
    // PUSHDATA1 <size=3> <3 bytes>
    const ops = collect(new Uint8Array([0x4c, 0x03, 0xaa, 0xbb, 0xcc]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x4c);
    expect(ops[0].data).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]));
  });

  it('parses PUSHDATA2', () => {
    // PUSHDATA2 <size=2 in LE: 0x02, 0x00> <2 bytes>
    const ops = collect(new Uint8Array([0x4d, 0x02, 0x00, 0xaa, 0xbb]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x4d);
    expect(ops[0].data).toEqual(new Uint8Array([0xaa, 0xbb]));
  });

  it('parses PUSHDATA4', () => {
    // PUSHDATA4 <size=1 in LE: 0x01, 0x00, 0x00, 0x00> <1 byte>
    const ops = collect(new Uint8Array([0x4e, 0x01, 0x00, 0x00, 0x00, 0xff]));
    expect(ops).toHaveLength(1);
    expect(ops[0].opcode).toBe(0x4e);
    expect(ops[0].data).toEqual(new Uint8Array([0xff]));
  });

  it('throws on truncated direct push', () => {
    // Push 2 bytes but only 1 available
    expect(() => collect(new Uint8Array([0x02, 0x44]))).toThrow(ScriptParseError);
  });

  it('throws on truncated PUSHDATA1 size', () => {
    expect(() => collect(new Uint8Array([0x4c]))).toThrow(ScriptParseError);
  });

  it('throws on truncated PUSHDATA1 data', () => {
    // Size says 5 but only 2 bytes remain
    expect(() => collect(new Uint8Array([0x4c, 0x05, 0xaa, 0xbb]))).toThrow(ScriptParseError);
  });

  it('throws on truncated PUSHDATA2 size', () => {
    expect(() => collect(new Uint8Array([0x4d, 0x02]))).toThrow(ScriptParseError);
  });

  it('throws on truncated PUSHDATA4 size', () => {
    expect(() => collect(new Uint8Array([0x4e, 0x01, 0x00]))).toThrow(ScriptParseError);
  });

  it('parses multiple opcodes in sequence', () => {
    // OP_RETURN + push "DD" + push [0x01]
    const ops = collect(new Uint8Array([0x6a, 0x02, 0x44, 0x44, 0x01, 0x01]));
    expect(ops).toHaveLength(3);
    expect(ops[0].opcode).toBe(0x6a); // OP_RETURN
    expect(ops[1].data).toEqual(new Uint8Array([0x44, 0x44])); // "DD"
    expect(ops[2].data).toEqual(new Uint8Array([0x01])); // type=1
  });
});
