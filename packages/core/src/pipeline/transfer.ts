/**
 * Transfer pipeline — full flow from request to broadcast.
 *
 * 1. getDDTokenUTXOs() + getStandardUTXOs()
 * 2. Select DD UTXOs covering transfer amount
 * 3. decodeBech32m(toAddress) → recipient x-only pubkey
 * 4. signer.getPublicKey() → spenderPubKey (for DD change)
 * 5. TransferBuilder.build(...)
 * 6. computeTaprootSighash + sign + witness for each input
 * 7. Serialize + broadcast
 */

import { TransferBuilder, serializeTransaction } from '@digidollar/tx-builder';
import type { DDTokenUTXO } from '@digidollar/tx-builder';
import { bytesToHex } from '@digidollar/tx-parser';
import type { Signer } from '../signer/interface.js';
import type { Backend } from '../backend/interface.js';
import type { UTXOManager } from '../utxo/manager.js';
import { decodeBech32m } from '../signer/address.js';
import { computeTaprootSighash, type PrevoutData } from './sighash.js';
import { buildKeyPathWitness, injectWitness } from './witness.js';
import { InsufficientDDError } from '../errors.js';
import type { TransferRequest, TransferResult } from './types.js';
import { DEFAULT_FEE_RATE } from '../config.js';

export async function executeTransfer(
  req: TransferRequest,
  signer: Signer,
  backend: Backend,
  utxoManager: UTXOManager,
): Promise<TransferResult> {
  // 1. Get classified UTXOs
  const classified = await utxoManager.getClassifiedUTXOs();

  // 2. Calculate total DD needed
  let totalDDNeeded = 0n;
  for (const r of req.recipients) {
    totalDDNeeded += r.ddAmountCents;
  }

  // Select DD UTXOs (simple: use all, builder handles change)
  const ddUtxos = classified.ddTokens;
  let totalDDAvailable = 0n;
  for (const u of ddUtxos) {
    totalDDAvailable += u.ddAmountCents;
  }
  if (totalDDAvailable < totalDDNeeded) {
    throw new InsufficientDDError(totalDDNeeded, totalDDAvailable);
  }

  // Select minimal DD UTXOs covering the needed amount
  const selectedDD = selectDDUtxos(ddUtxos, totalDDNeeded);

  // 3. Decode recipient addresses to x-only pubkeys
  const recipients = req.recipients.map(r => {
    const { program } = decodeBech32m(r.toAddress);
    return { recipientPubKey: program, ddAmountCents: r.ddAmountCents };
  });

  // 4. Get spender's public key and change destination
  const spenderPubKey = await signer.getPublicKey();
  const changeScriptPubKey = await signer.getScriptPubKey();
  const changeDest = bytesToHex(changeScriptPubKey);

  // 5. Build unsigned transaction
  const feeRate = req.feeRate ?? DEFAULT_FEE_RATE;
  const builderResult = TransferBuilder.build({
    recipients,
    ddUtxos: selectedDD,
    feeUtxos: classified.standard,
    spenderPubKey,
    feeRate,
    changeDest,
  });

  // 6. Sign each input
  const { unsignedTx } = builderResult;
  const prevouts: PrevoutData[] = buildPrevouts(unsignedTx, selectedDD, classified.standard);

  for (let i = 0; i < unsignedTx.inputs.length; i++) {
    const sighash = computeTaprootSighash({
      tx: unsignedTx,
      inputIndex: i,
      prevouts,
    });

    const signature = await signer.sign({
      inputIndex: i,
      sighash,
      publicKey: spenderPubKey,
      isScriptPath: false,
    });

    injectWitness(unsignedTx, i, buildKeyPathWitness(signature));
  }

  // 7. Serialize and broadcast
  const signedBytes = serializeTransaction(unsignedTx);
  const rawTx = bytesToHex(signedBytes);
  const txid = await backend.sendRawTransaction(rawTx);

  // Calculate DD change
  let totalSelectedDD = 0n;
  for (const u of selectedDD) {
    totalSelectedDD += u.ddAmountCents;
  }
  const ddChangeCents = totalSelectedDD - totalDDNeeded;

  return {
    txid,
    recipients: req.recipients,
    feeSats: builderResult.fee,
    ddChangeCents,
    rawTx,
  };
}

/** Select minimal DD UTXOs to cover a target amount (largest-first) */
function selectDDUtxos(available: DDTokenUTXO[], target: bigint): DDTokenUTXO[] {
  // Sort by amount descending
  const sorted = [...available].sort((a, b) => {
    if (b.ddAmountCents > a.ddAmountCents) return 1;
    if (b.ddAmountCents < a.ddAmountCents) return -1;
    return 0;
  });

  const selected: DDTokenUTXO[] = [];
  let total = 0n;

  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.ddAmountCents;
    if (total >= target) break;
  }

  return selected;
}

function buildPrevouts(
  unsignedTx: import('@digidollar/tx-builder').UnsignedTx,
  ddUtxos: DDTokenUTXO[],
  feeUtxos: import('@digidollar/tx-builder').UTXO[],
): PrevoutData[] {
  // Inputs are ordered: DD utxos first, then fee utxos (matching TransferBuilder)
  const allUtxos = [...ddUtxos, ...feeUtxos];

  return unsignedTx.inputs.map((input, i) => {
    const utxo = allUtxos.find(u => u.txid === input.txid && u.vout === input.vout);
    if (!utxo) throw new Error(`UTXO not found for input ${i}: ${input.txid}:${input.vout}`);
    return {
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      scriptPubKey: utxo.scriptPubKey,
    };
  });
}
