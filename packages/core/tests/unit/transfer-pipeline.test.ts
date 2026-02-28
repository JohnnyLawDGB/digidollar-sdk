import { describe, it, expect, vi } from 'vitest';
import { executeTransfer } from '../../src/pipeline/transfer.js';
import type { Backend } from '../../src/backend/interface.js';
import type { Signer } from '../../src/signer/interface.js';
import { UTXOManager } from '../../src/utxo/manager.js';
import { DD_VERSION_TRANSFER } from '@digidollar/tx-builder';
import { InsufficientDDError } from '../../src/errors.js';
import { encodeBech32m } from '../../src/signer/address.js';

function createMockBackend(): Backend {
  // Create a DD transfer tx with a DD token UTXO
  const ddTokenScriptPubKey = '5120' + 'dd'.repeat(32);

  // Build a simple OP_RETURN that tx-parser can parse for transfer amounts
  // DD prefix (4444) + txType transfer (02) + amount 50000 cents as 3 bytes
  const opReturnHex = '6a' + '02' + '4444' + '01' + '02' + '0650c3'; // simplified

  return {
    listUnspent: vi.fn().mockResolvedValue([
      // DD token UTXO
      { txid: 'dd_utxo1', vout: 0, scriptPubKey: ddTokenScriptPubKey, valueSats: 0n, confirmations: 6 },
      // Standard fee UTXO
      { txid: 'fee_utxo1', vout: 0, scriptPubKey: '5120' + 'ee'.repeat(32), valueSats: 100_000_000n, confirmations: 6 },
    ]),
    getTransaction: vi.fn(),
    batchGetTransactions: vi.fn().mockResolvedValue(new Map([
      ['dd_utxo1', {
        txid: 'dd_utxo1', hash: 'dd_utxo1', version: DD_VERSION_TRANSFER,
        size: 300, vsize: 200, weight: 800, locktime: 0, vin: [],
        vout: [
          { value: 0, n: 0, scriptPubKey: { asm: '', hex: ddTokenScriptPubKey, type: 'witness_v1_taproot' } },
          { value: 0, n: 1, scriptPubKey: { asm: '', hex: opReturnHex, type: 'nulldata' } },
        ],
      }],
      ['fee_utxo1', {
        txid: 'fee_utxo1', hash: 'fee_utxo1', version: 2,
        size: 200, vsize: 150, weight: 600, locktime: 0, vin: [],
        vout: [
          { value: 1.0, n: 0, scriptPubKey: { asm: '', hex: '5120' + 'ee'.repeat(32), type: 'witness_v1_taproot' } },
        ],
      }],
    ])),
    sendRawTransaction: vi.fn().mockResolvedValue('transfer_txid'),
    getBlockCount: vi.fn().mockResolvedValue(60000),
    getOraclePrice: vi.fn(),
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

describe('executeTransfer', () => {
  it('should throw InsufficientDDError when not enough DD tokens', async () => {
    const backend = createMockBackend();
    const signer = createMockSigner();
    const utxoManager = new UTXOManager(backend);

    // The mock DD token has ddAmountCents from OP_RETURN parsing
    // With our simplified OP_RETURN, the parser may assign 0 cents
    // Request more than available
    const recipientKey = new Uint8Array(32).fill(0xff);
    const recipientAddr = encodeBech32m(recipientKey, 'testnet');

    await expect(
      executeTransfer(
        {
          recipients: [{ toAddress: recipientAddr, ddAmountCents: 999_999_999n }],
        },
        signer,
        backend,
        utxoManager,
      ),
    ).rejects.toThrow(InsufficientDDError);
  });
});
