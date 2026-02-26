/** Network type for DigiByte nodes */
export type Network = 'mainnet' | 'testnet' | 'regtest';

/** DigiDollar address prefixes: DD (mainnet), TD (testnet), RD (regtest) */
export type DDAddressPrefix = 'DD' | 'TD' | 'RD';

/**
 * Lock tier for DigiDollar collateral positions.
 * Higher tiers = longer lock = lower collateral ratio required.
 *
 * | Tier | Lock Period | Collateral Ratio |
 * |------|------------ |------------------|
 * |  0   | 1 hour      | 1000%            |
 * |  1   | 30 days     | 500%             |
 * |  2   | 90 days     | 400%             |
 * |  3   | 180 days    | 350%             |
 * |  4   | 1 year      | 300%             |
 * |  5   | 2 years     | 275%             |
 * |  6   | 3 years     | 250%             |
 * |  7   | 5 years     | 225%             |
 * |  8   | 7 years     | 212%             |
 * |  9   | 10 years    | 200%             |
 */
export type LockTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** DigiDollar transaction types */
export type DDTxType = 'mint' | 'transfer' | 'redeem';

/** Transaction category as returned by listdigidollartxs */
export type TxCategory = 'mint' | 'send' | 'receive' | 'redeem';

/** Health status tiers */
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'emergency';

/** Oracle status */
export type OracleStatus = 'reporting' | 'stopped' | 'no_data';

/** Oracle price source */
export type OraclePriceSource = 'local' | 'on-chain' | 'pending' | 'none';

/** Position status */
export type PositionStatus = 'active' | 'unlocked' | 'redeemed';

/** Redemption path */
export type RedemptionPath = 'normal' | 'emergency' | 'liquidation';

/** BIP9 deployment status */
export type DeploymentStatus = 'defined' | 'started' | 'locked_in' | 'active' | 'failed';

/** Protocol constants from consensus/digidollar.h */
export const PROTOCOL = {
  BLOCKS_PER_DAY: 5760,
  CENT: 1_000_000,
  MIN_MINT_AMOUNT: 10_000,
  MAX_MINT_AMOUNT: 10_000_000,
  MIN_OUTPUT_AMOUNT: 100,
  ORACLE_COUNT: 30,
  ACTIVE_ORACLES: 15,
  ORACLE_THRESHOLD: 8,
  PRICE_VALID_BLOCKS: 20,
  VOLATILITY_THRESHOLD: 20,
  EMERGENCY_THRESHOLD: 100,
} as const;

/** Lock tier configuration */
export const LOCK_TIERS: Record<LockTier, { days: number; blocks: number; ratio: number }> = {
  0: { days: 0, blocks: 240, ratio: 1000 },
  1: { days: 30, blocks: 172_800, ratio: 500 },
  2: { days: 90, blocks: 518_400, ratio: 400 },
  3: { days: 180, blocks: 1_036_800, ratio: 350 },
  4: { days: 365, blocks: 2_102_400, ratio: 300 },
  5: { days: 730, blocks: 4_204_800, ratio: 275 },
  6: { days: 1095, blocks: 6_307_200, ratio: 250 },
  7: { days: 1825, blocks: 10_512_000, ratio: 225 },
  8: { days: 2555, blocks: 14_716_800, ratio: 212 },
  9: { days: 3650, blocks: 21_024_000, ratio: 200 },
};
