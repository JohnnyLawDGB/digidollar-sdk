/**
 * DigiDollar transaction detection via nVersion bitmask.
 *
 * Version encoding (transaction.h:46-58):
 *   nVersion = (type << 24) | (flags << 16) | 0x0770
 *   Detection: (nVersion & 0xFFFF) === 0x0770
 *   Type: (nVersion >>> 24) & 0xFF
 */

import { DD_MARKER, DD_VERSION_MASK, DD_TX_MINT, DD_TX_TRANSFER, DD_TX_REDEEM } from './types/constants.js';

/** DD transaction type strings */
export type DDTxType = 'mint' | 'transfer' | 'redeem';

/**
 * Check if a transaction is a DigiDollar transaction.
 * Accepts either a raw version number or an object with a version field.
 */
export function isDigiDollarTx(input: number | { version: number }): boolean {
  const version = typeof input === 'number' ? input : input.version;
  return (version & DD_VERSION_MASK) === DD_MARKER;
}

/**
 * Extract the DD transaction type from a version number.
 * Returns null for non-DD transactions or unknown types.
 */
export function getDDTxType(version: number): DDTxType | null {
  if ((version & DD_VERSION_MASK) !== DD_MARKER) return null;

  // Use unsigned right shift to avoid sign extension
  const typeNum = (version >>> 24) & 0xFF;

  switch (typeNum) {
    case DD_TX_MINT: return 'mint';
    case DD_TX_TRANSFER: return 'transfer';
    case DD_TX_REDEEM: return 'redeem';
    default: return null;
  }
}
