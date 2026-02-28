import type { DDPosition } from '@digidollar/rpc-client';

/** Health status tiers for positions */
export type PositionHealth = 'healthy' | 'warning' | 'critical';

/** A DD position enriched with computed fields */
export interface EnrichedPosition extends DDPosition {
  /** Blocks until unlock (0 if already unlocked) */
  blocksUntilUnlock: number;
  /** Estimated seconds until unlock */
  secondsUntilUnlock: number;
  /** Whether the position can be redeemed right now */
  canRedeemNow: boolean;
  /** Computed health status based on health_ratio */
  healthStatus: PositionHealth;
  /** Effective collateral-to-DD ratio percentage */
  effectiveRatio: number;
}
