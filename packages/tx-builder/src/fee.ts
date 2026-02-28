/**
 * Fee estimation — ports txbuilder.cpp:1401-1422.
 *
 * Estimates transaction virtual size (vsize) from input/output counts,
 * then applies fee rate with safety margin.
 */

import { WITNESS_PER_INPUT, FEE_SAFETY_MARGIN, MIN_FEE_RATE, MAX_FEE_RATE } from './constants.js';
import { InvalidParamsError } from './errors.js';

/** Overhead bytes for a SegWit transaction (version, marker, flag, locktime) */
const TX_OVERHEAD = 4 + 1 + 1 + 4; // version + marker + flag + locktime = 10

/** Base bytes per input (32 txid + 4 vout + 1 scriptSig len + 0 scriptSig + 4 sequence) */
const INPUT_BASE_SIZE = 41;

/** Base bytes per output (8 value + 1 scriptLen + variable script) */
const OUTPUT_BASE_SIZE = 9; // 8 value + 1 len (script added separately)

/** P2TR scriptPubKey is 34 bytes (OP_1 0x20 <32-byte key>) */
const P2TR_SCRIPT_SIZE = 34;

/** OP_RETURN scripts are typically 40-80 bytes */
const OP_RETURN_ESTIMATE = 60;

/**
 * Estimate the virtual size (vsize) of a transaction.
 *
 * vsize = (base_size * 3 + total_size) / 4
 * Then applies 35% safety margin.
 *
 * @param inputCount Number of inputs
 * @param outputCount Number of outputs (including OP_RETURN)
 * @param p2trOutputCount Number of outputs with P2TR scripts (for size estimation)
 * @param opReturnCount Number of OP_RETURN outputs
 * @returns Estimated vsize including safety margin
 */
export function estimateVsize(
  inputCount: number,
  outputCount: number,
  _p2trOutputCount?: number,
  opReturnCount?: number,
): number {
  const opRetOuts = opReturnCount ?? 0;
  const standardOuts = outputCount - opRetOuts;

  // Base size (non-witness)
  const baseInputs = inputCount * INPUT_BASE_SIZE;
  const baseOutputs = standardOuts * (OUTPUT_BASE_SIZE + P2TR_SCRIPT_SIZE) +
                      opRetOuts * (OUTPUT_BASE_SIZE + OP_RETURN_ESTIMATE);
  const baseSize = TX_OVERHEAD + 1 + baseInputs + 1 + baseOutputs; // +1 for vin/vout count varints

  // Witness size
  const witnessSize = inputCount * WITNESS_PER_INPUT;

  // Total size
  const totalSize = baseSize + witnessSize;

  // Virtual size: (base_size * 3 + total_size) / 4
  const vsize = Math.ceil((baseSize * 3 + totalSize) / 4);

  // Apply safety margin
  return Math.ceil(vsize * FEE_SAFETY_MARGIN);
}

/**
 * Calculate fee in satoshis from vsize and fee rate.
 *
 * @param vsize Transaction virtual size in vbytes
 * @param feeRate Fee rate in sat/vB
 * @returns Fee in satoshis
 */
export function calculateFee(vsize: number, feeRate: bigint): bigint {
  if (feeRate < MIN_FEE_RATE) {
    throw new InvalidParamsError(`Fee rate ${feeRate} sat/vB below minimum ${MIN_FEE_RATE}`);
  }
  if (feeRate > MAX_FEE_RATE) {
    throw new InvalidParamsError(`Fee rate ${feeRate} sat/vB above maximum ${MAX_FEE_RATE}`);
  }
  return BigInt(vsize) * feeRate;
}
