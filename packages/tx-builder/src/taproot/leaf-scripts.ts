/**
 * Leaf script construction for DigiDollar collateral MAST.
 *
 * Normal path: <lockHeight> OP_CLTV OP_DROP <ownerKey> OP_CHECKSIG
 * ERR path:    <lockHeight> OP_CLTV OP_DROP OP_CHECKCOLLATERAL 100 OP_LESSTHAN OP_VERIFY OP_DIGIDOLLAR OP_DDVERIFY <ownerKey> OP_CHECKSIG
 */

import {
  OP_CHECKLOCKTIMEVERIFY, OP_DROP, OP_CHECKSIG,
  OP_CHECKCOLLATERAL, OP_LESSTHAN, OP_VERIFY,
  OP_DIGIDOLLAR, OP_DDVERIFY,
} from '../constants.js';
import { pushData, pushNum, opcode } from '../tx/script-builder.js';

/**
 * Build the Normal redemption leaf script.
 * <lockHeight> OP_CHECKLOCKTIMEVERIFY OP_DROP <ownerKey> OP_CHECKSIG
 */
export function buildNormalLeaf(ownerPubKey: Uint8Array, lockHeight: number): Uint8Array {
  const parts: Uint8Array[] = [];
  parts.push(pushNum(BigInt(lockHeight)));
  parts.push(opcode(OP_CHECKLOCKTIMEVERIFY));
  parts.push(opcode(OP_DROP));
  parts.push(pushData(ownerPubKey));
  parts.push(opcode(OP_CHECKSIG));
  return concat(parts);
}

/**
 * Build the ERR (Emergency Redemption Reserve) leaf script.
 * <lockHeight> OP_CHECKLOCKTIMEVERIFY OP_DROP
 * OP_CHECKCOLLATERAL 100 OP_LESSTHAN OP_VERIFY
 * OP_DIGIDOLLAR OP_DDVERIFY
 * <ownerKey> OP_CHECKSIG
 */
export function buildERRLeaf(ownerPubKey: Uint8Array, lockHeight: number): Uint8Array {
  const parts: Uint8Array[] = [];
  parts.push(pushNum(BigInt(lockHeight)));
  parts.push(opcode(OP_CHECKLOCKTIMEVERIFY));
  parts.push(opcode(OP_DROP));
  parts.push(opcode(OP_CHECKCOLLATERAL));
  parts.push(pushNum(100n));
  parts.push(opcode(OP_LESSTHAN));
  parts.push(opcode(OP_VERIFY));
  parts.push(opcode(OP_DIGIDOLLAR));
  parts.push(opcode(OP_DDVERIFY));
  parts.push(pushData(ownerPubKey));
  parts.push(opcode(OP_CHECKSIG));
  return concat(parts);
}

function concat(parts: Uint8Array[]): Uint8Array {
  let totalLen = 0;
  for (const p of parts) totalLen += p.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}
