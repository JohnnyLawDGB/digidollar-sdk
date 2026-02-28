/**
 * Redeem pipeline — full flow from request to broadcast.
 *
 * 1. positionTracker.getPosition(positionId) → verify redeemable
 * 2. backend.getBlockCount() → verify height ≥ unlockHeight
 * 3. utxoManager.getClassifiedUTXOs()
 * 4. Find collateral UTXO matching position
 * 5. Select DD token UTXOs covering redeem amount
 * 6. RedeemBuilder.build(...)
 * 7. Compute sighashes (script-path for collateral, key-path for others)
 * 8. Sign + inject witness
 * 9. Serialize + broadcast
 */

import {
  RedeemBuilder, serializeTransaction,
  buildCollateralMAST,
} from '@digidollar/tx-builder';
import type { DDTokenUTXO, UTXO } from '@digidollar/tx-builder';
import { bytesToHex } from '@digidollar/tx-parser';
import type { Signer } from '../signer/interface.js';
import type { Backend } from '../backend/interface.js';
import type { UTXOManager } from '../utxo/manager.js';
import type { PositionTracker } from '../position/tracker.js';
import { computeTaprootSighash, type PrevoutData } from './sighash.js';
import { buildKeyPathWitness, buildScriptPathWitness, injectWitness } from './witness.js';
import { PositionError, InsufficientDDError } from '../errors.js';
import type { RedeemRequest, RedeemResult } from './types.js';
import { DEFAULT_FEE_RATE } from '../config.js';

export async function executeRedeem(
  req: RedeemRequest,
  signer: Signer,
  backend: Backend,
  utxoManager: UTXOManager,
  positionTracker: PositionTracker,
): Promise<RedeemResult> {
  // 1. Get position and verify redeemable
  const position = await positionTracker.getPosition(req.positionId);
  if (!position) {
    throw new PositionError(`Position not found: ${req.positionId}`);
  }
  if (!position.canRedeemNow) {
    throw new PositionError(
      `Position ${req.positionId} not yet redeemable (${position.blocksUntilUnlock} blocks remaining)`,
    );
  }

  // 2. Get current height
  const currentHeight = await backend.getBlockCount();
  if (currentHeight < position.unlock_height) {
    throw new PositionError(
      `Current height ${currentHeight} < unlock height ${position.unlock_height}`,
    );
  }

  // 3. Get classified UTXOs
  const classified = await utxoManager.getClassifiedUTXOs();

  // 4. Find collateral UTXO for this position
  // The position_id is the mint txid, collateral is at vout=0
  const collateralUtxo = classified.ddCollateral.find(
    u => u.txid === req.positionId && u.vout === 0,
  );
  if (!collateralUtxo) {
    throw new PositionError(`Collateral UTXO not found for position ${req.positionId}`);
  }

  // 5. Determine redeem amount
  // dd_minted is a string like "500.00", convert to cents
  const ddMintedCents = BigInt(Math.round(parseFloat(position.dd_minted) * 100));
  const ddToRedeemCents = req.ddAmountCents ?? ddMintedCents;

  // Select DD UTXOs
  let totalDDAvailable = 0n;
  for (const u of classified.ddTokens) {
    totalDDAvailable += u.ddAmountCents;
  }
  if (totalDDAvailable < ddToRedeemCents) {
    throw new InsufficientDDError(ddToRedeemCents, totalDDAvailable);
  }

  const selectedDD = selectDDUtxos(classified.ddTokens, ddToRedeemCents);

  // 6. Build unsigned transaction
  const feeRate = req.feeRate ?? DEFAULT_FEE_RATE;
  const ownerPubKey = await signer.getPublicKey();
  const changeScriptPubKey = await signer.getScriptPubKey();
  const changeDest = bytesToHex(changeScriptPubKey);
  const collateralDest = changeDest; // Return collateral to same wallet

  const builderResult = RedeemBuilder.build({
    collateralUtxo,
    ddToRedeemCents,
    ddUtxos: selectedDD,
    feeUtxos: classified.standard,
    ownerPubKey,
    currentHeight,
    unlockHeight: position.unlock_height,
    collateralAmount: collateralUtxo.value,
    feeRate,
    collateralDest,
    changeDest,
  });

  // 7. Rebuild MAST for collateral witness
  const mastData = buildCollateralMAST(ownerPubKey, position.unlock_height);

  // Build prevouts for all inputs
  const { unsignedTx } = builderResult;
  const allInputUtxos: Array<UTXO | DDTokenUTXO> = [
    collateralUtxo,
    ...selectedDD,
    ...classified.standard,
  ];

  const prevouts: PrevoutData[] = unsignedTx.inputs.map((input, i) => {
    const utxo = allInputUtxos.find(u => u.txid === input.txid && u.vout === input.vout);
    if (!utxo) throw new Error(`UTXO not found for input ${i}: ${input.txid}:${input.vout}`);
    return {
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      scriptPubKey: utxo.scriptPubKey,
    };
  });

  // 8. Sign each input
  for (let i = 0; i < unsignedTx.inputs.length; i++) {
    const isCollateral = i === 0;

    const sighash = computeTaprootSighash({
      tx: unsignedTx,
      inputIndex: i,
      prevouts,
      leafHash: isCollateral ? mastData.normalLeafHash : undefined,
    });

    const signature = await signer.sign({
      inputIndex: i,
      sighash,
      publicKey: ownerPubKey,
      isScriptPath: isCollateral,
    });

    if (isCollateral) {
      // Script-path witness: [sig, normalLeafScript, controlBlock]
      // Sibling is the ERR leaf hash
      const witness = buildScriptPathWitness(
        signature,
        mastData.normalLeaf,
        mastData.errLeafHash,
        mastData.parity,
      );
      injectWitness(unsignedTx, i, witness);
    } else {
      // Key-path witness: [sig]
      injectWitness(unsignedTx, i, buildKeyPathWitness(signature));
    }
  }

  // 9. Serialize and broadcast
  const signedBytes = serializeTransaction(unsignedTx);
  const rawTx = bytesToHex(signedBytes);
  const txid = await backend.sendRawTransaction(rawTx);

  const positionClosed = ddToRedeemCents >= ddMintedCents;

  return {
    txid,
    positionId: req.positionId,
    ddRedeemedCents: ddToRedeemCents,
    dgbReturnedSats: collateralUtxo.value,
    feeSats: builderResult.fee,
    positionClosed,
    rawTx,
  };
}

/** Select minimal DD UTXOs to cover a target amount (largest-first) */
function selectDDUtxos(available: DDTokenUTXO[], target: bigint): DDTokenUTXO[] {
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
