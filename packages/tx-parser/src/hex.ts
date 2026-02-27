const HEX_CHARS = '0123456789abcdef';

/** Convert hex string to Uint8Array */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const hi = hex.charCodeAt(i);
    const lo = hex.charCodeAt(i + 1);
    bytes[i / 2] = (unhex(hi) << 4) | unhex(lo);
  }
  return bytes;
}

/** Convert Uint8Array to hex string */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    hex += HEX_CHARS[b >> 4];
    hex += HEX_CHARS[b & 0x0f];
  }
  return hex;
}

/** Convert DGB amount (float) to satoshis (bigint). 1 DGB = 100,000,000 sats. */
export function dgbToSats(dgb: number): bigint {
  return BigInt(Math.round(dgb * 100_000_000));
}

function unhex(charCode: number): number {
  // '0'-'9' = 48-57
  if (charCode >= 48 && charCode <= 57) return charCode - 48;
  // 'a'-'f' = 97-102
  if (charCode >= 97 && charCode <= 102) return charCode - 87;
  // 'A'-'F' = 65-70
  if (charCode >= 65 && charCode <= 70) return charCode - 55;
  throw new Error(`Invalid hex character: ${String.fromCharCode(charCode)}`);
}
