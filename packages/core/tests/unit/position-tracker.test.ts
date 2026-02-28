import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PositionTracker } from '../../src/position/tracker.js';
import type { Backend } from '../../src/backend/interface.js';

function createMockBackend(): Backend {
  return {
    listUnspent: vi.fn(),
    getTransaction: vi.fn(),
    batchGetTransactions: vi.fn(),
    sendRawTransaction: vi.fn(),
    getBlockCount: vi.fn(),
    getOraclePrice: vi.fn(),
    getAllOraclePrices: vi.fn(),
    listPositions: vi.fn(),
    getBalance: vi.fn(),
    getStats: vi.fn(),
    getRedemptionInfo: vi.fn(),
    estimateCollateral: vi.fn(),
  };
}

const MOCK_POSITION = {
  position_id: 'abc123',
  dd_minted: '500.00',
  dgb_collateral: '10000.00',
  lock_tier: 1,
  lock_days: 30,
  unlock_height: 100_000,
  blocks_remaining: 5000,
  status: 'active' as const,
  health_ratio: 250,
  can_redeem: false,
  created_date: '2026-01-01',
  unlock_date: '2026-01-31',
};

describe('PositionTracker', () => {
  let mockBackend: Backend;
  let tracker: PositionTracker;

  beforeEach(() => {
    mockBackend = createMockBackend();
    tracker = new PositionTracker(mockBackend);
  });

  describe('getPositions', () => {
    it('should enrich positions with computed fields', async () => {
      vi.mocked(mockBackend.listPositions).mockResolvedValue([MOCK_POSITION]);
      vi.mocked(mockBackend.getBlockCount).mockResolvedValue(95_000);

      const positions = await tracker.getPositions();
      expect(positions).toHaveLength(1);

      const pos = positions[0]!;
      expect(pos.blocksUntilUnlock).toBe(5000); // 100000 - 95000
      expect(pos.secondsUntilUnlock).toBe(5000 * 15); // 15s per block
      expect(pos.canRedeemNow).toBe(false);
      expect(pos.healthStatus).toBe('healthy'); // ratio 250 >= 200
      expect(pos.effectiveRatio).toBe(250);
    });

    it('should detect unlocked positions', async () => {
      vi.mocked(mockBackend.listPositions).mockResolvedValue([
        { ...MOCK_POSITION, status: 'unlocked' as const },
      ]);
      vi.mocked(mockBackend.getBlockCount).mockResolvedValue(95_000);

      const positions = await tracker.getPositions();
      expect(positions[0]!.canRedeemNow).toBe(true);
    });

    it('should detect redeemable when past unlock height', async () => {
      vi.mocked(mockBackend.listPositions).mockResolvedValue([MOCK_POSITION]);
      vi.mocked(mockBackend.getBlockCount).mockResolvedValue(200_000); // well past unlock

      const positions = await tracker.getPositions();
      expect(positions[0]!.blocksUntilUnlock).toBe(0);
      expect(positions[0]!.canRedeemNow).toBe(true);
    });

    it('should classify health status correctly', async () => {
      vi.mocked(mockBackend.getBlockCount).mockResolvedValue(95_000);

      // Healthy (>= 200)
      vi.mocked(mockBackend.listPositions).mockResolvedValue([
        { ...MOCK_POSITION, health_ratio: 200 },
      ]);
      let positions = await tracker.getPositions();
      expect(positions[0]!.healthStatus).toBe('healthy');

      // Warning (150-199)
      vi.mocked(mockBackend.listPositions).mockResolvedValue([
        { ...MOCK_POSITION, health_ratio: 175 },
      ]);
      positions = await tracker.getPositions();
      expect(positions[0]!.healthStatus).toBe('warning');

      // Critical (< 150)
      vi.mocked(mockBackend.listPositions).mockResolvedValue([
        { ...MOCK_POSITION, health_ratio: 120 },
      ]);
      positions = await tracker.getPositions();
      expect(positions[0]!.healthStatus).toBe('critical');
    });
  });

  describe('getPosition', () => {
    it('should find position by ID', async () => {
      vi.mocked(mockBackend.listPositions).mockResolvedValue([MOCK_POSITION]);
      vi.mocked(mockBackend.getBlockCount).mockResolvedValue(95_000);

      const pos = await tracker.getPosition('abc123');
      expect(pos).not.toBeNull();
      expect(pos!.position_id).toBe('abc123');
    });

    it('should return null for unknown position', async () => {
      vi.mocked(mockBackend.listPositions).mockResolvedValue([]);
      vi.mocked(mockBackend.getBlockCount).mockResolvedValue(95_000);

      const pos = await tracker.getPosition('unknown');
      expect(pos).toBeNull();
    });
  });
});
