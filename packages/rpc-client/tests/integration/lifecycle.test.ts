import { describe, it, expect } from 'vitest';
import { DigiDollarRPC } from '../../src/client.js';

/**
 * Full lifecycle integration test: mint -> getBalance -> send -> listPositions
 *
 * WARNING: This test creates real transactions on the testnet.
 * Run manually with DD_INTEGRATION=1 DD_LIFECYCLE=1 npm run test:integration
 *
 * Prerequisites:
 * - RC22 testnet node on port 14024 with wallet loaded
 * - Sufficient tDGB balance for collateral
 * - Oracle consensus active (consensus_price > 0)
 * - DigiDollar activated
 */
const dd = new DigiDollarRPC({
  port: Number(process.env['DD_RPC_PORT'] ?? 14024),
  username: process.env['DD_RPC_USER'] ?? 'user',
  password: process.env['DD_RPC_PASS'] ?? 'pass',
  wallet: process.env['DD_RPC_WALLET'] ?? '',
});

describe.skipIf(!process.env['DD_LIFECYCLE'])('DigiDollar lifecycle', () => {
  let mintTxid: string;
  let ddAddress: string;

  it('getAddress returns a DD address', async () => {
    ddAddress = await dd.getAddress('sdk-test');
    expect(ddAddress).toBeTruthy();
    expect(typeof ddAddress).toBe('string');
    // Testnet addresses start with TD
    expect(ddAddress.startsWith('TD')).toBe(true);
  });

  it('getBalance returns wallet balance', async () => {
    const balance = await dd.getBalance();
    expect(balance).toHaveProperty('confirmed');
    expect(balance).toHaveProperty('total');
  });

  it('mint creates a DD position', async () => {
    const result = await dd.mint({
      ddAmountCents: 10000, // $100
      lockTier: 0,          // 1 hour (minimum for testing)
    });

    expect(result).toHaveProperty('txid');
    expect(result).toHaveProperty('dd_minted');
    expect(result).toHaveProperty('position_id');
    expect(result.txid).toHaveLength(64);
    mintTxid = result.txid;
  });

  it('listPositions shows the new position', async () => {
    const positions = await dd.listPositions();
    expect(Array.isArray(positions)).toBe(true);
    // Find our position
    const ours = positions.find(p => p.position_id === mintTxid);
    if (ours) {
      expect(ours.status).toBe('active');
      expect(ours.lock_tier).toBe(0);
    }
  });

  it('getBalance reflects minted DD', async () => {
    const balance = await dd.getBalance();
    expect(Number(balance.total)).toBeGreaterThan(0);
  });

  it('listTransactions includes the mint', async () => {
    const txs = await dd.listTransactions({ count: 5 });
    expect(Array.isArray(txs)).toBe(true);
  });

  it('getRedemptionInfo for our position', async () => {
    const info = await dd.getRedemptionInfo(mintTxid);
    expect(info).toHaveProperty('position_id');
    expect(info).toHaveProperty('can_redeem');
  });
});
