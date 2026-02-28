/**
 * RedeemBuilder — constructs unsigned DD redeem (burn) transactions.
 *
 * Ports txbuilder.cpp:1050-1273.
 *
 * Outputs:
 *   [0] Collateral return — DGB to owner
 *   [1] DD change output (optional, if partial redeem) — P2TR key-path (zero value)
 *   [2] OP_RETURN (optional, if partial redeem) — DD metadata with change amount
 *   [N] DGB fee change (optional)
 */

import { hexToBytes } from '@digidollar/tx-parser';
import {
  DD_VERSION_REDEEM, DUST_THRESHOLD,
  SEQUENCE_CLTV_ENABLED, SEQUENCE_FINAL,
  MIN_REDEEM_FEE,
} from '../constants.js';
import { InvalidParamsError, InsufficientDDError } from '../errors.js';
import { estimateVsize, calculateFee } from '../fee.js';
import { buildTokenP2TR } from '../taproot/mast.js';
import { encodeRedeemOpReturn } from '../op-return-encode.js';
import { serializeTransaction, computeTxid } from '../tx/serialize.js';
import type { RedeemParams, BuilderResult, TxInput, TxOutput, UnsignedTx } from '../types.js';

export class RedeemBuilder {
  static build(params: RedeemParams): BuilderResult {
    // Validate parameters
    if (params.ownerPubKey.length !== 32) throw new InvalidParamsError('Owner public key must be 32 bytes');
    if (params.ddToRedeemCents <= 0n) throw new InvalidParamsError('Redeem amount must be positive');
    if (params.currentHeight < params.unlockHeight) {
      throw new InvalidParamsError(
        `Position not yet unlocked: current height ${params.currentHeight} < unlock height ${params.unlockHeight}`,
      );
    }
    if (params.collateralAmount <= 0n) throw new InvalidParamsError('Collateral amount must be positive');
    if (params.ddUtxos.length === 0) throw new InvalidParamsError('Must have DD UTXOs to burn');

    // Check DD input sufficiency
    let totalDDIn = 0n;
    for (const utxo of params.ddUtxos) {
      totalDDIn += utxo.ddAmountCents;
    }
    if (totalDDIn < params.ddToRedeemCents) {
      throw new InsufficientDDError(params.ddToRedeemCents, totalDDIn);
    }

    const ddChange = totalDDIn - params.ddToRedeemCents;

    // Collateral return = full collateral (for full redeem, this is 100%)
    const collateralReturn = params.collateralAmount;

    // Build inputs
    const inputs: TxInput[] = [];

    // Input 0: Collateral UTXO — nSequence must enable CLTV
    inputs.push({
      txid: params.collateralUtxo.txid,
      vout: params.collateralUtxo.vout,
      scriptSig: new Uint8Array(0),
      sequence: SEQUENCE_CLTV_ENABLED,
      witness: [],
    });

    // DD inputs to burn — also need CLTV-compatible sequence
    for (const utxo of params.ddUtxos) {
      inputs.push({
        txid: utxo.txid,
        vout: utxo.vout,
        scriptSig: new Uint8Array(0),
        sequence: SEQUENCE_CLTV_ENABLED,
        witness: [],
      });
    }

    // Fee inputs — standard sequence
    for (const utxo of params.feeUtxos) {
      inputs.push({
        txid: utxo.txid,
        vout: utxo.vout,
        scriptSig: new Uint8Array(0),
        sequence: SEQUENCE_FINAL,
        witness: [],
      });
    }

    // Build outputs
    const outputs: TxOutput[] = [];

    // [0] Collateral return to owner
    outputs.push({
      value: collateralReturn,
      scriptPubKey: hexToBytes(params.collateralDest),
    });

    // DD change output + OP_RETURN (if partial redeem)
    if (ddChange > 0n) {
      // DD change P2TR
      const ddChangeScript = buildTokenP2TR(params.ownerPubKey);
      outputs.push({ value: 0n, scriptPubKey: ddChangeScript });

      // OP_RETURN with DD change amount
      const opReturnScript = encodeRedeemOpReturn(ddChange);
      outputs.push({ value: 0n, scriptPubKey: opReturnScript });
    }

    // Calculate fee
    let totalFeeIn = 0n;
    for (const utxo of params.feeUtxos) {
      totalFeeIn += utxo.value;
    }

    const outputCount = outputs.length + 1; // +1 for potential DGB change
    const vsize = estimateVsize(inputs.length, outputCount, outputs.length, ddChange > 0n ? 1 : 0);
    let fee = calculateFee(vsize, params.feeRate);
    if (fee < MIN_REDEEM_FEE) fee = MIN_REDEEM_FEE;

    // DGB fee change output
    const dgbChange = totalFeeIn - fee;
    if (dgbChange >= DUST_THRESHOLD) {
      outputs.push({
        value: dgbChange,
        scriptPubKey: hexToBytes(params.changeDest),
      });
    } else if (dgbChange >= 0n) {
      fee = totalFeeIn;
    } else {
      throw new InvalidParamsError(
        `Insufficient fee funds: need ${fee} sats, have ${totalFeeIn} sats`,
      );
    }

    const unsignedTx: UnsignedTx = {
      version: DD_VERSION_REDEEM,
      inputs,
      outputs,
      locktime: params.unlockHeight,
    };

    const tx = serializeTransaction(unsignedTx);
    const txid = computeTxid(unsignedTx);

    return { tx, txid, fee, unsignedTx };
  }
}
