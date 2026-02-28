/** JSON reviver that converts "123n" strings back to BigInt */
export function bigintReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && /^\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }
  return value;
}
