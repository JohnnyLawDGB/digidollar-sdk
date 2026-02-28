/**
 * MAST (Merkelized Abstract Syntax Tree) builder for DigiDollar collateral.
 *
 * 2-leaf tree at depth 1:
 *   Leaf A: Normal redemption (CLTV + CHECKSIG)
 *   Leaf B: ERR emergency redemption (CLTV + CHECKCOLLATERAL + DDVERIFY + CHECKSIG)
 *
 * Finalized with NUMS internal key (forces script-path spend).
 */

import { NUMS_POINT, OP_1 } from '../constants.js';
import { buildNormalLeaf, buildERRLeaf } from './leaf-scripts.js';
import { tapleafHash, tapbranchHash } from './tagged-hash.js';
import { tweakPublicKey } from './tweak.js';
import type { CollateralSpendData } from '../types.js';

/**
 * Build the collateral MAST tree and derive the P2TR output.
 *
 * @param ownerPubKey Owner's x-only public key (32 bytes)
 * @param lockHeight Absolute lock height (block number)
 * @returns CollateralSpendData with scriptPubKey and spend info
 */
export function buildCollateralMAST(
  ownerPubKey: Uint8Array,
  lockHeight: number,
): CollateralSpendData {
  // Build leaf scripts
  const normalLeaf = buildNormalLeaf(ownerPubKey, lockHeight);
  const errLeaf = buildERRLeaf(ownerPubKey, lockHeight);

  // Hash leaves
  const normalLeafHash = tapleafHash(normalLeaf);
  const errLeafHash = tapleafHash(errLeaf);

  // Build branch (merkle root of 2-leaf tree)
  const merkleRoot = tapbranchHash(normalLeafHash, errLeafHash);

  // Tweak NUMS point with merkle root
  const { outputKey, parity } = tweakPublicKey(NUMS_POINT, merkleRoot);

  // Build P2TR scriptPubKey: OP_1 <32-byte output key>
  const scriptPubKey = new Uint8Array(34);
  scriptPubKey[0] = OP_1;
  scriptPubKey[1] = 0x20; // push 32 bytes
  scriptPubKey.set(outputKey, 2);

  return {
    scriptPubKey,
    outputKey,
    parity,
    merkleRoot,
    normalLeaf,
    errLeaf,
    normalLeafHash,
    errLeafHash,
  };
}

/**
 * Build a key-path-only P2TR output for DD token ownership.
 * The owner key is tweaked with no merkle root (key-path spending only).
 *
 * @param ownerPubKey Owner's x-only public key (32 bytes)
 * @returns P2TR scriptPubKey bytes (34 bytes: OP_1 0x20 <output_key>)
 */
export function buildTokenP2TR(ownerPubKey: Uint8Array): Uint8Array {
  const { outputKey } = tweakPublicKey(ownerPubKey);

  const scriptPubKey = new Uint8Array(34);
  scriptPubKey[0] = OP_1;
  scriptPubKey[1] = 0x20;
  scriptPubKey.set(outputKey, 2);

  return scriptPubKey;
}
