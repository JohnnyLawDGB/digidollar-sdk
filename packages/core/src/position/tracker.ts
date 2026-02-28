/**
 * Position Tracker — enriches raw position data with computed fields.
 */

import type { Backend } from '../backend/interface.js';
import type { EnrichedPosition, PositionHealth } from './types.js';

/** Average DigiByte block time in seconds */
const BLOCK_TIME_SECS = 15;

export class PositionTracker {
  constructor(private readonly backend: Backend) {}

  /** Get all positions with enrichment */
  async getPositions(activeOnly?: boolean): Promise<EnrichedPosition[]> {
    const [positions, currentHeight] = await Promise.all([
      this.backend.listPositions(activeOnly),
      this.backend.getBlockCount(),
    ]);

    return positions.map(pos => this.enrich(pos, currentHeight));
  }

  /** Get a single position by ID */
  async getPosition(positionId: string): Promise<EnrichedPosition | null> {
    const positions = await this.getPositions(false);
    return positions.find(p => p.position_id === positionId) ?? null;
  }

  private enrich(pos: import('@digidollar/rpc-client').DDPosition, currentHeight: number): EnrichedPosition {
    const blocksUntilUnlock = Math.max(0, pos.unlock_height - currentHeight);
    const secondsUntilUnlock = blocksUntilUnlock * BLOCK_TIME_SECS;
    const canRedeemNow = pos.status === 'unlocked' || blocksUntilUnlock === 0;

    let healthStatus: PositionHealth;
    if (pos.health_ratio >= 200) {
      healthStatus = 'healthy';
    } else if (pos.health_ratio >= 150) {
      healthStatus = 'warning';
    } else {
      healthStatus = 'critical';
    }

    return {
      ...pos,
      blocksUntilUnlock,
      secondsUntilUnlock,
      canRedeemNow,
      healthStatus,
      effectiveRatio: pos.health_ratio,
    };
  }
}
