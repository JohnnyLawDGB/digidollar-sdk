import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UTXOManager } from '../../src/utxo/manager.js';
import type { Backend } from '../../src/backend/interface.js';
import { DD_VERSION_MINT, DD_VERSION_TRANSFER } from '@digidollar/tx-builder';

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

describe('UTXOManager', () => {
  let mockBackend: Backend;
  let manager: UTXOManager;

  beforeEach(() => {
    mockBackend = createMockBackend();
    manager = new UTXOManager(mockBackend);
  });

  it('should return empty set when no UTXOs', async () => {
    vi.mocked(mockBackend.listUnspent).mockResolvedValue([]);
    const result = await manager.getClassifiedUTXOs();
    expect(result.standard).toHaveLength(0);
    expect(result.ddTokens).toHaveLength(0);
    expect(result.ddCollateral).toHaveLength(0);
    expect(result.standardBalance).toBe(0n);
    expect(result.ddBalance).toBe(0n);
  });

  it('should classify standard UTXOs (non-DD transactions)', async () => {
    vi.mocked(mockBackend.listUnspent).mockResolvedValue([
      { txid: 'aaa', vout: 0, scriptPubKey: '5120' + 'ab'.repeat(32), valueSats: 100_000_000n, confirmations: 6 },
    ]);

    // Standard (non-DD) transaction
    const standardTx = {
      txid: 'aaa',
      hash: 'aaa',
      version: 2, // standard version, not DD
      size: 200,
      vsize: 150,
      weight: 600,
      locktime: 0,
      vin: [],
      vout: [
        { value: 1.0, n: 0, scriptPubKey: { asm: '', hex: '5120' + 'ab'.repeat(32), type: 'witness_v1_taproot' } },
      ],
    };

    vi.mocked(mockBackend.batchGetTransactions).mockResolvedValue(new Map([['aaa', standardTx as any]]));

    const result = await manager.getClassifiedUTXOs();
    expect(result.standard).toHaveLength(1);
    expect(result.standard[0]!.txid).toBe('aaa');
    expect(result.standard[0]!.value).toBe(100_000_000n);
    expect(result.standardBalance).toBe(100_000_000n);
    expect(result.ddTokens).toHaveLength(0);
  });

  it('should classify DD token UTXOs from mint transactions', async () => {
    // A DD mint transaction has:
    // vout[0]: collateral (P2TR with value)
    // vout[1]: DD token (P2TR zero-value)
    // vout[2]: OP_RETURN metadata
    vi.mocked(mockBackend.listUnspent).mockResolvedValue([
      { txid: 'mint1', vout: 1, scriptPubKey: '5120' + 'cc'.repeat(32), valueSats: 0n, confirmations: 6 },
    ]);

    // DD mint tx with OP_RETURN encoding 50000 cents = 500 DD
    const mintTx = {
      txid: 'mint1',
      hash: 'mint1',
      version: DD_VERSION_MINT,
      size: 300,
      vsize: 200,
      weight: 800,
      locktime: 0,
      vin: [],
      vout: [
        { value: 10.0, n: 0, scriptPubKey: { asm: '', hex: '5120' + 'aa'.repeat(32), type: 'witness_v1_taproot' } },
        { value: 0, n: 1, scriptPubKey: { asm: '', hex: '5120' + 'cc'.repeat(32), type: 'witness_v1_taproot' } },
        { value: 0, n: 2, scriptPubKey: { asm: '', hex: '6a' + '02' + '4444' + '01' + '01' + '0450c3' + '03' + 'e80300', type: 'nulldata' } },
      ],
    };

    vi.mocked(mockBackend.batchGetTransactions).mockResolvedValue(new Map([['mint1', mintTx as any]]));

    const result = await manager.getClassifiedUTXOs();
    expect(result.ddTokens).toHaveLength(1);
    expect(result.ddTokens[0]!.txid).toBe('mint1');
    expect(result.ddTokens[0]!.vout).toBe(1);
  });

  describe('getStandardUTXOs', () => {
    it('should return only standard UTXOs', async () => {
      vi.mocked(mockBackend.listUnspent).mockResolvedValue([
        { txid: 'std1', vout: 0, scriptPubKey: '76a914' + 'ab'.repeat(20) + '88ac', valueSats: 50_000_000n, confirmations: 3 },
      ]);

      const stdTx = {
        txid: 'std1', hash: 'std1', version: 2, size: 200, vsize: 150, weight: 600, locktime: 0, vin: [],
        vout: [{ value: 0.5, n: 0, scriptPubKey: { asm: '', hex: '76a914' + 'ab'.repeat(20) + '88ac', type: 'pubkeyhash' } }],
      };
      vi.mocked(mockBackend.batchGetTransactions).mockResolvedValue(new Map([['std1', stdTx as any]]));

      const std = await manager.getStandardUTXOs();
      expect(std).toHaveLength(1);
      expect(std[0]!.value).toBe(50_000_000n);
    });
  });
});
