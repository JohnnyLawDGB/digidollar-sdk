/**
 * Witness construction for signed Taproot transactions.
 *
 * Key-path spend: [signature]
 * Script-path spend: [signature, leafScript, controlBlock]
 *   controlBlock = (leafVersion | parity) || internalKey || siblingHash
 */

import { TAPSCRIPT_LEAF_VERSION, NUMS_POINT } from '@digidollar/tx-builder';

/**
 * Build a key-path witness (P2TR key-path spend).
 * witness = [64-byte schnorr signature]
 */
export function buildKeyPathWitness(signature: Uint8Array): Uint8Array[] {
  return [signature];
}

/**
 * Build a script-path witness for collateral redemption.
 * witness = [signature, leafScript, controlBlock]
 *
 * The control block for a 2-leaf MAST with NUMS internal key:
 *   (leafVersion | parity) || NUMS_POINT || siblingHash
 *
 * @param signature 64-byte Schnorr signature
 * @param leafScript The leaf script being executed (normalLeaf for normal redemption)
 * @param siblingHash 32-byte hash of the sibling leaf
 * @param outputKeyParity 0 or 1, the parity of the tweaked output key
 */
export function buildScriptPathWitness(
  signature: Uint8Array,
  leafScript: Uint8Array,
  siblingHash: Uint8Array,
  outputKeyParity: number,
): Uint8Array[] {
  // Control block: 1 + 32 + 32 = 65 bytes for depth-1 leaf
  const controlBlock = new Uint8Array(65);
  controlBlock[0] = TAPSCRIPT_LEAF_VERSION | outputKeyParity;
  controlBlock.set(NUMS_POINT, 1);
  controlBlock.set(siblingHash, 33);

  return [signature, leafScript, controlBlock];
}

/**
 * Inject witness data into a transaction's inputs.
 * Modifies the UnsignedTx in-place.
 */
export function injectWitness(
  tx: import('@digidollar/tx-builder').UnsignedTx,
  inputIndex: number,
  witness: Uint8Array[],
): void {
  const input = tx.inputs[inputIndex];
  if (!input) throw new Error(`No input at index ${inputIndex}`);
  input.witness = witness;
}
