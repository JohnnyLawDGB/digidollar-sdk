/**
 * Bitcoin CompactSize (varint) encoding.
 *
 * 0-0xFC:       1 byte
 * 0xFD-0xFFFF:  0xFD + 2 bytes LE
 * 0x10000-0xFFFFFFFF: 0xFE + 4 bytes LE
 * 0x100000000+: 0xFF + 8 bytes LE
 */

/** Encode a non-negative integer as CompactSize bytes. */
export function encodeVarint(n: number): Uint8Array {
  if (n < 0) throw new Error('Varint cannot be negative');

  if (n < 0xfd) {
    return new Uint8Array([n]);
  }
  if (n <= 0xffff) {
    const buf = new Uint8Array(3);
    buf[0] = 0xfd;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    return buf;
  }
  if (n <= 0xffffffff) {
    const buf = new Uint8Array(5);
    buf[0] = 0xfe;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    buf[3] = (n >> 16) & 0xff;
    buf[4] = (n >> 24) & 0xff;
    return buf;
  }
  // n > 0xFFFFFFFF — use 8-byte LE
  const buf = new Uint8Array(9);
  buf[0] = 0xff;
  const lo = n >>> 0;
  const hi = Math.floor(n / 0x100000000) >>> 0;
  buf[1] = lo & 0xff;
  buf[2] = (lo >> 8) & 0xff;
  buf[3] = (lo >> 16) & 0xff;
  buf[4] = (lo >> 24) & 0xff;
  buf[5] = hi & 0xff;
  buf[6] = (hi >> 8) & 0xff;
  buf[7] = (hi >> 16) & 0xff;
  buf[8] = (hi >> 24) & 0xff;
  return buf;
}
