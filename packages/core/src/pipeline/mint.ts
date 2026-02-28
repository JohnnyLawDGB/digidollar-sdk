/**
 * Mint pipeline — full flow from request to broadcast.
 *
 * 1. requireFreshPrice()
 * 2. getBlockCount()
 * 3. getStandardUTXOs()
 * 4. signer.getPublicKey() → ownerPubKey
 * 5. signer.getScriptPubKey(changePath) → changeDest
 * 6. MintBuilder.build(...)
 * 7. computeTaprootSighash() for each input
 * 8. signer.sign() for each input
 * 9. Inject witness, serialize, broadcast
 */

import { MintBuilder, serializeTransaction, lockTierToBlocks } from '@digidollar/tx-builder';
import { bytesToHex } from '@digidollar/tx-parser';
import type { Signer } from '../signer/interface.js';
import type { Backend } from '../backend/interface.js';
import type { UTXOManager } from '../utxo/manager.js';
import type { OracleWrapper } from '../oracle/wrapper.js';
import { computeTaprootSighash, type PrevoutData } from './sighash.js';
import { buildKeyPathWitness, injectWitness } from './witness.js';
import type { MintRequest, MintResult } from './types.js';
import { DEFAULT_FEE_RATE } from '../config.js';

export async function executeMint(
  req: MintRequest,
  signer: Signer,
  backend: Backend,
  utxoManager: UTXOManager,
  oracle: OracleWrapper,
): Promise<MintResult> {
  // 1. Get fresh oracle price
  const priceSnapshot = await oracle.requireFreshPrice();

  // 2. Get current block height
  const currentHeight = await backend.getBlockCount();

  // 3. Get spendable UTXOs
  const standardUtxos = await utxoManager.getStandardUTXOs();

  // 4. Get owner's public key
  const ownerPubKey = await signer.getPublicKey();

  // 5. Get change destination
  const changeScriptPubKey = await signer.getScriptPubKey();
  const changeDest = bytesToHex(changeScriptPubKey);

  // 6. Build unsigned transaction
  const feeRate = req.feeRate ?? DEFAULT_FEE_RATE;
  const builderResult = MintBuilder.build({
    ddAmountCents: req.ddAmountCents,
    lockTier: req.lockTier,
    ownerPubKey,
    oraclePriceMicroUsd: priceSnapshot.priceMicroUsd,
    currentHeight,
    utxos: standardUtxos,
    feeRate,
    changeDest,
  });

  // 7. Compute sighash for each input and sign
  const { unsignedTx } = builderResult;
  const prevouts: PrevoutData[] = unsignedTx.inputs.map((input, i) => {
    const utxo = standardUtxos.find(u => u.txid === input.txid && u.vout === input.vout);
    if (!utxo) throw new Error(`UTXO not found for input ${i}: ${input.txid}:${input.vout}`);
    return {
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      scriptPubKey: utxo.scriptPubKey,
    };
  });

  for (let i = 0; i < unsignedTx.inputs.length; i++) {
    const sighash = computeTaprootSighash({
      tx: unsignedTx,
      inputIndex: i,
      prevouts,
    });

    // 8. Sign
    const signature = await signer.sign({
      inputIndex: i,
      sighash,
      publicKey: ownerPubKey,
      isScriptPath: false,
    });

    // 9. Inject witness
    injectWitness(unsignedTx, i, buildKeyPathWitness(signature));
  }

  // Serialize and broadcast
  const signedBytes = serializeTransaction(unsignedTx);
  const rawTx = bytesToHex(signedBytes);
  const txid = await backend.sendRawTransaction(rawTx);

  const lockBlocks = lockTierToBlocks(req.lockTier);
  const unlockHeight = currentHeight + lockBlocks;

  return {
    txid,
    ddMintedCents: req.ddAmountCents,
    collateralSats: unsignedTx.outputs[0]!.value,
    feeSats: builderResult.fee,
    unlockHeight,
    rawTx,
  };
}
