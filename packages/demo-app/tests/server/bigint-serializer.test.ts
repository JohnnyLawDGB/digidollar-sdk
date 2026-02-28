import { describe, it, expect } from 'vitest';
import { bigintReplacer } from '../../src/middleware/bigint-serializer.js';

describe('bigintReplacer', () => {
  it('converts bigint values to "Nn" strings', () => {
    const data = { amount: 12345n, name: 'test', nested: { big: 99n } };
    const json = JSON.stringify(data, bigintReplacer);
    expect(json).toBe('{"amount":"12345n","name":"test","nested":{"big":"99n"}}');
  });

  it('leaves non-bigint values unchanged', () => {
    const data = { a: 42, b: 'hello', c: true, d: null };
    const json = JSON.stringify(data, bigintReplacer);
    expect(json).toBe('{"a":42,"b":"hello","c":true,"d":null}');
  });

  it('handles zero bigint', () => {
    const json = JSON.stringify({ val: 0n }, bigintReplacer);
    expect(json).toBe('{"val":"0n"}');
  });
});
