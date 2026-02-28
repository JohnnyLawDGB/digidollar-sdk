import { describe, it, expect, vi } from 'vitest';
import { executeRedeem } from '../../src/pipeline/redeem.js';
import type { Backend } from '../../src/backend/interface.js';
import type { Signer } from '../../src/signer/interface.js';
import { UTXOManager } from '../../src/utxo/manager.js';
import { PositionTracker } from '../../src/position/tracker.js';
import { PositionError } from '../../src/errors.js';

function createMockBackend(): Backend {
  return {
    listUnspent: vi.fn().mockResolvedValue([
      // Collateral UTXO
      { txid: 'position1', vout: 0, scriptPubKey: '5120' + 'aa'.repeat(32), valueSats: 1_000_000_000n, confirmations: 10 },
      // DD token UTXO
      { txid: 'dd_utxo', vout: 1, scriptPubKey: '5120' + 'bb'.repeat(32), valueSats: 0n, confirmations: 10 },
      // Fee UTXO
      { txid: 'fee_utxo', vout: 0, scriptPubKey: '5120' + 'cc'.repeat(32), valueSats: 100_000_000n, confirmations: 10 },
    ]),
    getTransaction: vi.fn(),
    batchGetTransactions: vi.fn().mockResolvedValue(new Map([
      ['position1', {
        txid: 'position1', hash: 'position1', version: 0x01000770,
        size: 300, vsize: 200, weight: 800, locktime: 0, vin: [],
        vout: [
          { value: 10.0, n: 0, scriptPubKey: { asm: '', hex: '5120' + 'aa'.repeat(32), type: 'witness_v1_taproot' } },
          { value: 0, n: 1, scriptPubKey: { asm: '', hex: '5120' + 'bb'.repeat(32), type: 'witness_v1_taproot' } },
          { value: 0, n: 2, scriptPubKey: { asm: '', hex: '6a024444010103e80300', type: 'nulldata' } },
        ],
      }],
      ['dd_utxo', {
        txid: 'dd_utxo', hash: 'dd_utxo', version: 0x01000770,
        size: 300, vsize: 200, weight: 800, locktime: 0, vin: [],
        vout: [
          { value: 10.0, n: 0, scriptPubKey: { asm: '', hex: '5120' + '11'.repeat(32), type: 'witness_v1_taproot' } },
          { value: 0, n: 1, scriptPubKey: { asm: '', hex: '5120' + 'bb'.repeat(32), type: 'witness_v1_taproot' } },
          { value: 0, n: 2, scriptPubKey: { asm: '', hex: '6a024444010103e80300', type: 'nulldata' } },
        ],
      }],
      ['fee_utxo', {
        txid: 'fee_utxo', hash: 'fee_utxo', version: 2,
        size: 200, vsize: 150, weight: 600, locktime: 0, vin: [],
        vout: [{ value: 1.0, n: 0, scriptPubKey: { asm: '', hex: '5120' + 'cc'.repeat(32), type: 'witness_v1_taproot' } }],
      }],
    ])),
    sendRawTransaction: vi.fn().mockResolvedValue('redeem_txid'),
    getBlockCount: vi.fn().mockResolvedValue(200_000),
    getOraclePrice: vi.fn(),
    getAllOraclePrices: vi.fn(),
    listPositions: vi.fn().mockResolvedValue([]),
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

describe('executeRedeem', () => {
  it('should throw PositionError when position not found', async () => {
    const backend = createMockBackend();
    const signer = createMockSigner();
    const utxoManager = new UTXOManager(backend);
    const positionTracker = new PositionTracker(backend);

    // listPositions returns empty, so position won't be found
    await expect(
      executeRedeem(
        { positionId: 'nonexistent_position' },
        signer,
        backend,
        utxoManager,
        positionTracker,
      ),
    ).rejects.toThrow(PositionError);
  });

  it('should throw PositionError when position not yet redeemable', async () => {
    const backend = createMockBackend();
    const signer = createMockSigner();
    const utxoManager = new UTXOManager(backend);
    const positionTracker = new PositionTracker(backend);

    // Position with future unlock height
    vi.mocked(backend.listPositions).mockResolvedValue([{
      position_id: 'locked_pos',
      dd_minted: '500.00',
      dgb_collateral: '10000.00',
      lock_tier: 1,
      lock_days: 30,
      unlock_height: 999_999,
      blocks_remaining: 799_999,
      status: 'active',
      health_ratio: 250,
      can_redeem: false,
      created_date: '2026-01-01',
      unlock_date: '2027-01-01',
    }]);
    vi.mocked(backend.getBlockCount).mockResolvedValue(200_000);

    await expect(
      executeRedeem(
        { positionId: 'locked_pos' },
        signer,
        backend,
        utxoManager,
        positionTracker,
      ),
    ).rejects.toThrow(PositionError);
  });
});
