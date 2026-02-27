/**
 * Type guards and safety filters for classified outputs.
 *
 * The key function is filterSafeOutputs() — wallets should use this for
 * coin selection to prevent accidentally spending DD outputs as regular DGB.
 */

import type { ClassifiedOutput } from './types/classified.js';

/** Output is a DD token (zero-value P2TR representing DD ownership) */
export function isDDToken(output: ClassifiedOutput): boolean {
  return output.classification === 'dd_token';
}

/** Output is DD collateral (locked DGB backing DigiDollars) */
export function isDDCollateral(output: ClassifiedOutput): boolean {
  return output.classification === 'dd_collateral';
}

/** Output is DD metadata (OP_RETURN with protocol data) */
export function isDDMetadata(output: ClassifiedOutput): boolean {
  return output.classification === 'dd_metadata';
}

/** Output is standard DGB — safe to spend */
export function isStandard(output: ClassifiedOutput): boolean {
  return output.classification === 'standard';
}

/** Output belongs to the DD protocol (token, collateral, or metadata) */
export function isDDOutput(output: ClassifiedOutput): boolean {
  return output.classification !== 'standard';
}

/**
 * Filter outputs to only those safe for wallet coin selection.
 * Returns only 'standard' outputs — excludes all DD protocol outputs.
 *
 * This is the KEY SAFETY FUNCTION for wallet integration.
 */
export function filterSafeOutputs(outputs: ClassifiedOutput[]): ClassifiedOutput[] {
  return outputs.filter(isStandard);
}
