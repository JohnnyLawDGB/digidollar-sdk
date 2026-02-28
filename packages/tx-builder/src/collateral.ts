/**
 * Collateral calculation — ports txbuilder.cpp:128-186 using bigint.
 *
 * Formula: DGB_sats = (DD_cents * 100_000_000 * ratio_percent * 100) / oracle_micro_usd
 *
 * Uses bigint throughout to prevent overflow (C++ uses __int128).
 */

import { LOCK_TIERS, COIN, MAX_MONEY } from './constants.js';
import { InvalidParamsError } from './errors.js';

/**
 * Calculate required collateral in satoshis.
 *
 * @param ddCents DD amount in cents (100 = $1.00)
 * @param oracleMicroUsd Oracle price in micro-USD (1,000,000 = $1.00 DGB)
 * @param ratioPercent Collateral ratio percentage (e.g. 500 for 500%)
 * @returns Required collateral in satoshis
 */
export function calculateCollateral(
  ddCents: bigint,
  oracleMicroUsd: bigint,
  ratioPercent: number,
): bigint {
  if (ddCents <= 0n) throw new InvalidParamsError('DD amount must be positive');
  if (oracleMicroUsd <= 0n) throw new InvalidParamsError('Oracle price must be positive');
  if (ratioPercent <= 0) throw new InvalidParamsError('Ratio must be positive');

  // DGB_sats = (DD_cents * COIN * ratio_percent * 100) / oracle_micro_usd
  const numerator = ddCents * COIN * BigInt(ratioPercent) * 100n;
  const result = numerator / oracleMicroUsd;

  if (result > MAX_MONEY) {
    throw new InvalidParamsError('Collateral exceeds MAX_MONEY');
  }

  return result;
}

/**
 * Get the collateral ratio for a given lock tier.
 *
 * @param lockTier Tier index (0-9)
 * @returns Collateral ratio percentage (e.g. 500 for 500%)
 */
export function getCollateralRatio(lockTier: number): number {
  const entry = LOCK_TIERS[lockTier];
  if (!entry) {
    throw new InvalidParamsError(`Invalid lock tier: ${lockTier} (must be 0-9)`);
  }
  return entry.ratio;
}

/**
 * Get the lock block count for a given tier.
 *
 * @param lockTier Tier index (0-9)
 * @returns Number of blocks for the lock period
 */
export function lockTierToBlocks(lockTier: number): number {
  const entry = LOCK_TIERS[lockTier];
  if (!entry) {
    throw new InvalidParamsError(`Invalid lock tier: ${lockTier} (must be 0-9)`);
  }
  return entry.blocks;
}
