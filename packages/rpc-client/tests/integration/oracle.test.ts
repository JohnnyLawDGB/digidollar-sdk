import { describe, it, expect, beforeAll } from 'vitest';
import { DigiDollarRPC } from '../../src/client.js';

/**
 * Integration tests against a running RC22 testnet node.
 * Run with: DD_INTEGRATION=1 DD_RPC_USER=user DD_RPC_PASS=pass npm run test:integration
 *
 * Requires:
 * - DigiByte testnet node running on port 14024
 * - DigiDollar activated on the testnet chain
 */
const dd = new DigiDollarRPC({
  port: Number(process.env['DD_RPC_PORT'] ?? 14024),
  username: process.env['DD_RPC_USER'] ?? 'user',
  password: process.env['DD_RPC_PASS'] ?? 'pass',
  wallet: process.env['DD_RPC_WALLET'] ?? '',
});

describe.skipIf(!process.env['DD_INTEGRATION'])('Oracle integration', () => {
  it('getOraclePrice returns price data', async () => {
    const price = await dd.getOraclePrice();
    expect(price).toHaveProperty('price_micro_usd');
    expect(price).toHaveProperty('price_usd');
    expect(price).toHaveProperty('oracle_count');
    expect(price).toHaveProperty('is_stale');
    expect(typeof price.price_micro_usd).toBe('number');
  });

  it('getAllOraclePrices returns oracle list', async () => {
    const all = await dd.getAllOraclePrices();
    expect(all).toHaveProperty('oracles');
    expect(Array.isArray(all.oracles)).toBe(true);
    expect(all).toHaveProperty('consensus_price_micro_usd');
    expect(all).toHaveProperty('total_oracles');
  });

  it('getOracles returns array of oracle info', async () => {
    const oracles = await dd.getOracles();
    expect(Array.isArray(oracles)).toBe(true);
    if (oracles.length > 0) {
      const first = oracles[0]!;
      expect(first).toHaveProperty('oracle_id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('pubkey');
      expect(first).toHaveProperty('is_active');
    }
  });

  it('listOracle returns local oracle status', async () => {
    const local = await dd.listOracle();
    expect(local).toHaveProperty('running');
    expect(typeof local.running).toBe('boolean');
  });
});

describe.skipIf(!process.env['DD_INTEGRATION'])('System integration', () => {
  it('getStats returns system health', async () => {
    const stats = await dd.getStats();
    expect(stats).toHaveProperty('health_percentage');
    expect(stats).toHaveProperty('health_status');
    expect(stats).toHaveProperty('total_dd_supply');
    expect(stats).toHaveProperty('is_emergency');
    expect(typeof stats.health_percentage).toBe('number');
  });

  it('getDeploymentInfo shows activation status', async () => {
    const info = await dd.getDeploymentInfo();
    expect(info).toHaveProperty('enabled');
    expect(info).toHaveProperty('status');
    expect(typeof info.enabled).toBe('boolean');
  });

  it('getDcaMultiplier returns current multiplier', async () => {
    const dca = await dd.getDcaMultiplier();
    expect(dca).toHaveProperty('multiplier');
    expect(dca).toHaveProperty('system_health');
    expect(typeof dca.multiplier).toBe('number');
  });

  it('getProtectionStatus returns protection data', async () => {
    const status = await dd.getProtectionStatus();
    expect(status).toHaveProperty('dca');
    expect(status).toHaveProperty('err');
    expect(status).toHaveProperty('volatility');
    expect(status).toHaveProperty('overall');
  });

  it('validateAddress checks DD address format', async () => {
    const valid = await dd.validateAddress('TD1mthC1EspWDbkmdb1w9ZgMVBESxfF2aQawrL5YevaqUWpFXXaB');
    expect(valid).toHaveProperty('isvalid');
    expect(typeof valid.isvalid).toBe('boolean');
  });

  it('calculateCollateral returns requirement', async () => {
    // Provide oracle price manually since consensus may be stale
    const req = await dd.calculateCollateral({ ddAmountCents: 10000, lockDays: 365, oraclePrice: 1 });
    expect(req).toHaveProperty('required_dgb');
    expect(req).toHaveProperty('base_ratio');
    expect(req).toHaveProperty('effective_ratio');
  });

  it('estimateCollateral returns estimate', async () => {
    // Provide oracle price manually since consensus may be stale
    const est = await dd.estimateCollateral({ ddAmount: 10000, lockTier: 5, oraclePriceMicroUsd: 4200 });
    expect(est).toHaveProperty('required_dgb');
    expect(est).toHaveProperty('lock_tier');
  });
});
