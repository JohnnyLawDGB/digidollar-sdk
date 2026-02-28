import { describe, it, expect, vi } from 'vitest';
import { executeMint } from '../../src/pipeline/mint.js';
import type { Backend } from '../../src/backend/interface.js';
import type { Signer } from '../../src/signer/interface.js';
import { UTXOManager } from '../../src/utxo/manager.js';
import { OracleWrapper } from '../../src/oracle/wrapper.js';

function createMockBackend(): Backend {
  return {
    listUnspent: vi.fn().mockResolvedValue([
      { txid: 'utxo1', vout: 0, scriptPubKey: '5120' + 'aa'.repeat(32), valueSats: 600_000_000_000_000n, confirmations: 10 },
    ]),
    getTransaction: vi.fn(),
    batchGetTransactions: vi.fn().mockResolvedValue(new Map([
      ['utxo1', {
        txid: 'utxo1', hash: 'utxo1', version: 2, size: 200, vsize: 150, weight: 600, locktime: 0,
        vin: [], vout: [{ value: 5000, n: 0, scriptPubKey: { asm: '', hex: '5120' + 'aa'.repeat(32), type: 'witness_v1_taproot' } }],
      }],
    ])),
    sendRawTransaction: vi.fn().mockResolvedValue('broadcasted_txid'),
    getBlockCount: vi.fn().mockResolvedValue(60000),
    getOraclePrice: vi.fn().mockResolvedValue({
      price_micro_usd: 4500,
      price_cents: '0.0045',
      price_usd: 0.0045,
      last_update_height: 59990,
      last_update_time: Math.floor(Date.now() / 1000) - 5,
      validity_blocks: 20,
      is_stale: false,
      oracle_count: 8,
      status: 'active',
      '24h_high': '0.0050',
      '24h_low': '0.0040',
      volatility: 5,
    }),
    getAllOraclePrices: vi.fn(),
    listPositions: vi.fn(),
    getBalance: vi.fn(),
    getStats: vi.fn(),
    getRedemptionInfo: vi.fn(),
    estimateCollateral: vi.fn(),
  };
}

function createMockSigner(): Signer {
  const pubkey = new Uint8Array(32).fill(0x02);
  const scriptPubKey = new Uint8Array(34);
  scriptPubKey[0] = 0x51;
  scriptPubKey[1] = 0x20;
  scriptPubKey.set(new Uint8Array(32).fill(0x03), 2);

  return {
    getPublicKey: vi.fn().mockResolvedValue(pubkey),
    sign: vi.fn().mockResolvedValue(new Uint8Array(64).fill(0xcc)),
    getScriptPubKey: vi.fn().mockResolvedValue(scriptPubKey),
    getAddress: vi.fn().mockResolvedValue('dgbt1test'),
  };
}

describe('executeMint', () => {
  it('should execute full mint pipeline', async () => {
    const backend = createMockBackend();
    const signer = createMockSigner();
    const utxoManager = new UTXOManager(backend);
    const oracle = new OracleWrapper(backend);

    const result = await executeMint(
      { ddAmountCents: 50_000n, lockTier: 1 },
      signer,
      backend,
      utxoManager,
      oracle,
    );

    expect(result.txid).toBe('broadcasted_txid');
    expect(result.ddMintedCents).toBe(50_000n);
    expect(result.collateralSats).toBeGreaterThan(0n);
    expect(result.feeSats).toBeGreaterThan(0n);
    expect(result.unlockHeight).toBeGreaterThan(60000);
    expect(result.rawTx).toBeTruthy();

    // Signer should have been called for each input
    expect(signer.sign).toHaveBeenCalled();

    // Transaction should have been broadcast
    expect(backend.sendRawTransaction).toHaveBeenCalledWith(expect.any(String));
  });

  it('should use fresh oracle price', async () => {
    const backend = createMockBackend();
    const signer = createMockSigner();
    const utxoManager = new UTXOManager(backend);
    const oracle = new OracleWrapper(backend);

    await executeMint(
      { ddAmountCents: 100n, lockTier: 0 },
      signer,
      backend,
      utxoManager,
      oracle,
    );

    // Oracle should have been queried
    expect(backend.getOraclePrice).toHaveBeenCalled();
  });
});
