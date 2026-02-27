import { describe, it, expect } from 'vitest';
import { classifyTransaction } from '../../src/classify.js';
import { encodeScriptNum } from '../../src/script-num.js';
import { bytesToHex } from '../../src/hex.js';
import type { DecodedTx, TxOutput } from '../../src/types/transaction.js';

const FAKE_TXID = 'a'.repeat(64);
const FAKE_HASH = 'b'.repeat(64);

// Fake P2TR pubkeys
const PUBKEY_1 = '00'.repeat(32);
const PUBKEY_2 = 'ff'.repeat(32);
const PUBKEY_3 = 'ab'.repeat(32);

/** Build a P2TR scriptPubKey hex (OP_1 + push32 + 32-byte key) */
function p2trScript(pubkeyHex: string): string {
  return '5120' + pubkeyHex;
}

/** Build a P2PKH-like scriptPubKey hex (NOT P2TR, just for "standard" output testing) */
function p2pkhScript(): string {
  // OP_DUP OP_HASH160 push20 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
  return '76a914' + 'aa'.repeat(20) + '88ac';
}

/**
 * Build a DD OP_RETURN script hex from parts.
 * Parts after OP_RETURN and DD marker are push-encoded.
 */
function buildOpReturnHex(...dataParts: Uint8Array[]): string {
  const chunks: number[] = [0x6a]; // OP_RETURN
  // Push "DD"
  chunks.push(0x02, 0x44, 0x44);
  for (const part of dataParts) {
    if (part.length < 0x4c) {
      chunks.push(part.length, ...part);
    } else {
      chunks.push(0x4c, part.length, ...part);
    }
  }
  return bytesToHex(new Uint8Array(chunks));
}

function makeOutput(n: number, value: number, scriptHex: string): TxOutput {
  return {
    value,
    n,
    scriptPubKey: {
      asm: '',
      hex: scriptHex,
      type: scriptHex.startsWith('5120') ? 'witness_v1_taproot' : 'pubkeyhash',
      address: 'dgbt1qfake',
    },
  };
}

function makeTx(version: number, vout: TxOutput[]): DecodedTx {
  return {
    txid: FAKE_TXID,
    hash: FAKE_HASH,
    version,
    size: 250,
    vsize: 200,
    weight: 800,
    locktime: 0,
    vin: [{
      txid: '0'.repeat(64),
      vout: 0,
      scriptSig: { asm: '', hex: '' },
      sequence: 0xffffffff,
    }],
    vout,
  };
}

// Version numbers
const STANDARD_VERSION = 2;
const MINT_VERSION = (1 << 24) | 0x0770;
const TRANSFER_VERSION = (2 << 24) | 0x0770;
const REDEEM_VERSION = (3 << 24) | 0x0770;

describe('classifyTransaction', () => {
  describe('non-DD transaction', () => {
    it('classifies all outputs as standard', () => {
      const tx = makeTx(STANDARD_VERSION, [
        makeOutput(0, 1.5, p2pkhScript()),
        makeOutput(1, 0.5, p2trScript(PUBKEY_1)),
      ]);

      const result = classifyTransaction(tx);
      expect(result.isDigiDollar).toBe(false);
      expect(result.txType).toBeNull();
      expect(result.opReturn).toBeNull();
      expect(result.outputs).toHaveLength(2);
      expect(result.outputs.every(o => o.classification === 'standard')).toBe(true);
      expect(result.standard).toHaveLength(2);
      expect(result.tokens).toHaveLength(0);
      expect(result.collateral).toHaveLength(0);
      expect(result.metadata).toHaveLength(0);
    });
  });

  describe('mint transaction', () => {
    it('classifies collateral, token, metadata, and change', () => {
      const ownerPubKey = new Uint8Array(32).fill(0xab);
      const opReturnHex = buildOpReturnHex(
        encodeScriptNum(1n),     // type = mint
        encodeScriptNum(50000n), // 500 DD
        encodeScriptNum(172800n), // lock height
        encodeScriptNum(2n),     // lock tier
        ownerPubKey,             // owner pubkey
      );

      const tx = makeTx(MINT_VERSION, [
        makeOutput(0, 100.0, p2trScript(PUBKEY_1)),    // collateral (P2TR, value > 0)
        makeOutput(1, 0, p2trScript(PUBKEY_2)),         // DD token (P2TR, value = 0)
        makeOutput(2, 0, opReturnHex),                  // OP_RETURN metadata
        makeOutput(3, 50.0, p2pkhScript()),             // DGB change (non-P2TR)
      ]);

      const result = classifyTransaction(tx);
      expect(result.isDigiDollar).toBe(true);
      expect(result.txType).toBe('mint');
      expect(result.opReturn).not.toBeNull();
      expect(result.opReturn!.txType).toBe('mint');

      expect(result.collateral).toHaveLength(1);
      expect(result.collateral[0].index).toBe(0);

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].index).toBe(1);
      expect(result.tokens[0].ddAmountCents).toBe(50000n);

      expect(result.metadata).toHaveLength(1);
      expect(result.metadata[0].index).toBe(2);

      expect(result.standard).toHaveLength(1);
      expect(result.standard[0].index).toBe(3);
    });
  });

  describe('transfer transaction', () => {
    it('classifies 2 token outputs with correct amounts', () => {
      const opReturnHex = buildOpReturnHex(
        encodeScriptNum(2n),     // type = transfer
        encodeScriptNum(10000n), // 100 DD to recipient 1
        encodeScriptNum(5000n),  // 50 DD to recipient 2
      );

      const tx = makeTx(TRANSFER_VERSION, [
        makeOutput(0, 0, p2trScript(PUBKEY_1)),         // DD token for recipient 1
        makeOutput(1, 0, p2trScript(PUBKEY_2)),         // DD token for recipient 2
        makeOutput(2, 0, opReturnHex),                  // OP_RETURN metadata
        makeOutput(3, 0.001, p2pkhScript()),            // dust change
      ]);

      const result = classifyTransaction(tx);
      expect(result.isDigiDollar).toBe(true);
      expect(result.txType).toBe('transfer');

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].ddAmountCents).toBe(10000n);
      expect(result.tokens[1].ddAmountCents).toBe(5000n);

      expect(result.metadata).toHaveLength(1);
      expect(result.standard).toHaveLength(1);
      expect(result.collateral).toHaveLength(0);
    });

    it('handles transfer with change token', () => {
      const opReturnHex = buildOpReturnHex(
        encodeScriptNum(2n),
        encodeScriptNum(10000n), // to recipient
        encodeScriptNum(40000n), // DD change back to sender
      );

      const tx = makeTx(TRANSFER_VERSION, [
        makeOutput(0, 0, p2trScript(PUBKEY_1)),         // DD to recipient
        makeOutput(1, 0, p2trScript(PUBKEY_2)),         // DD change
        makeOutput(2, 0, opReturnHex),                  // OP_RETURN
      ]);

      const result = classifyTransaction(tx);
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].ddAmountCents).toBe(10000n);
      expect(result.tokens[1].ddAmountCents).toBe(40000n);
    });
  });

  describe('redeem transaction', () => {
    it('classifies token being redeemed', () => {
      const opReturnHex = buildOpReturnHex(
        encodeScriptNum(3n),     // type = redeem
        encodeScriptNum(25000n), // 250 DD being redeemed
      );

      const tx = makeTx(REDEEM_VERSION, [
        makeOutput(0, 0, p2trScript(PUBKEY_1)),         // DD token (being burned)
        makeOutput(1, 0, opReturnHex),                  // OP_RETURN
        makeOutput(2, 95.0, p2pkhScript()),             // DGB returned to user
      ]);

      const result = classifyTransaction(tx);
      expect(result.isDigiDollar).toBe(true);
      expect(result.txType).toBe('redeem');

      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].ddAmountCents).toBe(25000n);

      expect(result.metadata).toHaveLength(1);
      expect(result.standard).toHaveLength(1);
      expect(result.collateral).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles DD tx without parseable OP_RETURN', () => {
      // DD version but OP_RETURN is missing/malformed
      const tx = makeTx(MINT_VERSION, [
        makeOutput(0, 100.0, p2trScript(PUBKEY_1)),
        makeOutput(1, 0, p2trScript(PUBKEY_2)),
        makeOutput(2, 0.5, p2pkhScript()),
      ]);

      const result = classifyTransaction(tx);
      expect(result.isDigiDollar).toBe(true);
      expect(result.opReturn).toBeNull();
      // Token still classified by structure, but no ddAmountCents
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].ddAmountCents).toBeUndefined();
      expect(result.collateral).toHaveLength(1);
    });

    it('non-P2TR zero-value output in DD tx is classified as standard', () => {
      const opReturnHex = buildOpReturnHex(
        encodeScriptNum(2n),
        encodeScriptNum(5000n),
      );

      const tx = makeTx(TRANSFER_VERSION, [
        makeOutput(0, 0, p2trScript(PUBKEY_1)),  // DD token
        makeOutput(1, 0, p2pkhScript()),          // zero-value non-P2TR → standard
        makeOutput(2, 0, opReturnHex),            // OP_RETURN
      ]);

      const result = classifyTransaction(tx);
      expect(result.tokens).toHaveLength(1);
      // The non-P2TR zero-value output is standard, not a token
      expect(result.standard).toHaveLength(1);
      expect(result.standard[0].index).toBe(1);
    });
  });
});
