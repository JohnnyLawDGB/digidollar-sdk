import { describe, it, expect } from 'vitest';
import { computeTaprootSighash } from '../../src/pipeline/sighash.js';
import type { UnsignedTx } from '@digidollar/tx-builder';

describe('computeTaprootSighash', () => {
  // A minimal valid transaction for sighash testing
  const minimalTx: UnsignedTx = {
    version: 2,
    inputs: [
      {
        txid: 'aa'.repeat(32),
        vout: 0,
        scriptSig: new Uint8Array(0),
        sequence: 0xffffffff,
        witness: [],
      },
    ],
    outputs: [
      {
        value: 50_000_000n,
        scriptPubKey: new Uint8Array([0x51, 0x20, ...new Array(32).fill(0xbb)]),
      },
    ],
    locktime: 0,
  };

  const prevouts = [
    {
      txid: 'aa'.repeat(32),
      vout: 0,
      value: 100_000_000n,
      scriptPubKey: '5120' + 'cc'.repeat(32),
    },
  ];

  it('should produce a 32-byte sighash', () => {
    const sighash = computeTaprootSighash({
      tx: minimalTx,
      inputIndex: 0,
      prevouts,
    });
    expect(sighash.length).toBe(32);
  });

  it('should produce different sighashes for different inputs', () => {
    const twoInputTx: UnsignedTx = {
      ...minimalTx,
      inputs: [
        ...minimalTx.inputs,
        {
          txid: 'bb'.repeat(32),
          vout: 1,
          scriptSig: new Uint8Array(0),
          sequence: 0xffffffff,
          witness: [],
        },
      ],
    };

    const twoPrevouts = [
      ...prevouts,
      { txid: 'bb'.repeat(32), vout: 1, value: 50_000_000n, scriptPubKey: '5120' + 'dd'.repeat(32) },
    ];

    const sighash0 = computeTaprootSighash({ tx: twoInputTx, inputIndex: 0, prevouts: twoPrevouts });
    const sighash1 = computeTaprootSighash({ tx: twoInputTx, inputIndex: 1, prevouts: twoPrevouts });

    expect(sighash0).not.toEqual(sighash1);
  });

  it('should produce different sighashes for key-path vs script-path', () => {
    const leafHash = new Uint8Array(32).fill(0xee);

    const keyPathHash = computeTaprootSighash({
      tx: minimalTx,
      inputIndex: 0,
      prevouts,
    });

    const scriptPathHash = computeTaprootSighash({
      tx: minimalTx,
      inputIndex: 0,
      prevouts,
      leafHash,
    });

    expect(keyPathHash).not.toEqual(scriptPathHash);
  });

  it('should be deterministic', () => {
    const hash1 = computeTaprootSighash({ tx: minimalTx, inputIndex: 0, prevouts });
    const hash2 = computeTaprootSighash({ tx: minimalTx, inputIndex: 0, prevouts });
    expect(hash1).toEqual(hash2);
  });

  it('should produce different hashes for different transaction versions', () => {
    const txV1 = { ...minimalTx, version: 1 };
    const hashV2 = computeTaprootSighash({ tx: minimalTx, inputIndex: 0, prevouts });
    const hashV1 = computeTaprootSighash({ tx: txV1, inputIndex: 0, prevouts });
    expect(hashV2).not.toEqual(hashV1);
  });
});
