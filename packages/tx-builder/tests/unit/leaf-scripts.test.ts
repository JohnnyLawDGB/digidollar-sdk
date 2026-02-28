import { describe, it, expect } from 'vitest';
import { buildNormalLeaf, buildERRLeaf } from '../../src/taproot/leaf-scripts.js';
import {
  OP_CHECKLOCKTIMEVERIFY, OP_DROP, OP_CHECKSIG,
  OP_CHECKCOLLATERAL, OP_LESSTHAN, OP_VERIFY,
  OP_DIGIDOLLAR, OP_DDVERIFY,
} from '../../src/constants.js';
import { iterScript, decodeScriptNum } from '@digidollar/tx-parser';
import { ownerKey } from './test-keys.js';

const lockHeight = 172800;

describe('buildNormalLeaf', () => {
  it('builds a valid script with correct opcodes', () => {
    const script = buildNormalLeaf(ownerKey, lockHeight);
    const ops = [...iterScript(script)];

    // <lockHeight> OP_CLTV OP_DROP <ownerKey> OP_CHECKSIG
    expect(ops.length).toBe(5);

    expect(ops[0]!.data).toBeDefined();
    expect(decodeScriptNum(ops[0]!.data!)).toBe(BigInt(lockHeight));

    expect(ops[1]!.opcode).toBe(OP_CHECKLOCKTIMEVERIFY);
    expect(ops[2]!.opcode).toBe(OP_DROP);

    expect(ops[3]!.data).toBeDefined();
    expect(ops[3]!.data!.length).toBe(32);

    expect(ops[4]!.opcode).toBe(OP_CHECKSIG);
  });

  it('is deterministic', () => {
    const a = buildNormalLeaf(ownerKey, lockHeight);
    const b = buildNormalLeaf(ownerKey, lockHeight);
    expect(a).toEqual(b);
  });

  it('changes with different lock height', () => {
    const a = buildNormalLeaf(ownerKey, 1000);
    const b = buildNormalLeaf(ownerKey, 2000);
    expect(a).not.toEqual(b);
  });
});

describe('buildERRLeaf', () => {
  it('builds a valid script with correct opcodes', () => {
    const script = buildERRLeaf(ownerKey, lockHeight);
    const ops = [...iterScript(script)];

    // <lockHeight> OP_CLTV OP_DROP OP_CHECKCOLLATERAL <100> OP_LESSTHAN OP_VERIFY OP_DIGIDOLLAR OP_DDVERIFY <ownerKey> OP_CHECKSIG
    expect(ops.length).toBe(11);

    expect(decodeScriptNum(ops[0]!.data!)).toBe(BigInt(lockHeight));
    expect(ops[1]!.opcode).toBe(OP_CHECKLOCKTIMEVERIFY);
    expect(ops[2]!.opcode).toBe(OP_DROP);
    expect(ops[3]!.opcode).toBe(OP_CHECKCOLLATERAL);
    expect(decodeScriptNum(ops[4]!.data!)).toBe(100n);
    expect(ops[5]!.opcode).toBe(OP_LESSTHAN);
    expect(ops[6]!.opcode).toBe(OP_VERIFY);
    expect(ops[7]!.opcode).toBe(OP_DIGIDOLLAR);
    expect(ops[8]!.opcode).toBe(OP_DDVERIFY);
    expect(ops[9]!.data!.length).toBe(32);
    expect(ops[10]!.opcode).toBe(OP_CHECKSIG);
  });

  it('ERR leaf is longer than Normal leaf', () => {
    const normal = buildNormalLeaf(ownerKey, lockHeight);
    const err = buildERRLeaf(ownerKey, lockHeight);
    expect(err.length).toBeGreaterThan(normal.length);
  });
});
