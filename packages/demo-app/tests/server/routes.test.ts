import { describe, it, expect } from 'vitest';
import { bigintReviver } from '../../client/src/lib/bigint-json';

describe('bigint JSON round-trip', () => {
  it('revives "123n" strings back to BigInt', () => {
    const json = '{"amount":"12345n","name":"test"}';
    const data = JSON.parse(json, bigintReviver);
    expect(data.amount).toBe(12345n);
    expect(data.name).toBe('test');
  });

  it('does not revive non-bigint strings', () => {
    const json = '{"addr":"abc123","count":"42n"}';
    const data = JSON.parse(json, bigintReviver);
    expect(data.addr).toBe('abc123');
    expect(data.count).toBe(42n);
  });

  it('handles zero', () => {
    const json = '{"val":"0n"}';
    const data = JSON.parse(json, bigintReviver);
    expect(data.val).toBe(0n);
  });
});
