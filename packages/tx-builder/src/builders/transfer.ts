/**
 * TransferBuilder — constructs unsigned DD transfer transactions.
 *
 * Ports txbuilder.cpp:577-862.
 *
 * Outputs:
 *   [0..N-1] DD token outputs — P2TR key-path for each recipient (zero value)
 *   [N]      DD change output (optional) — P2TR key-path for spender (zero value)
 *   [N+1]    DGB fee change output (optional)
 *   [last]   OP_RETURN — DD metadata with amounts
 */

import { hexToBytes } from '@digidollar/tx-parser';
import { DD_VERSION_TRANSFER, DUST_THRESHOLD, SEQUENCE_FINAL, MIN_DD_FEE } from '../constants.js';
import { InvalidParamsError, InsufficientDDError } from '../errors.js';
import { estimateVsize, calculateFee } from '../fee.js';
import { buildTokenP2TR } from '../taproot/mast.js';
import { encodeTransferOpReturn } from '../op-return-encode.js';
import { serializeTransaction, computeTxid } from '../tx/serialize.js';
import type { TransferParams, BuilderResult, TxInput, TxOutput, UnsignedTx } from '../types.js';

export class TransferBuilder {
  static build(params: TransferParams): BuilderResult {
    // Validate parameters
    if (params.recipients.length === 0) throw new InvalidParamsError('Must have at least one recipient');
    if (params.ddUtxos.length === 0) throw new InvalidParamsError('Must have DD UTXOs to spend');
    if (params.spenderPubKey.length !== 32) throw new InvalidParamsError('Spender public key must be 32 bytes');

    for (const r of params.recipients) {
      if (r.ddAmountCents <= 0n) throw new InvalidParamsError('Recipient DD amount must be positive');
      if (r.recipientPubKey.length !== 32) throw new InvalidParamsError('Recipient public key must be 32 bytes');
    }

    // Calculate DD totals
    let totalDDIn = 0n;
    for (const utxo of params.ddUtxos) {
      totalDDIn += utxo.ddAmountCents;
    }

    let totalDDOut = 0n;
    for (const r of params.recipients) {
      totalDDOut += r.ddAmountCents;
    }

    if (totalDDIn < totalDDOut) {
      throw new InsufficientDDError(totalDDOut, totalDDIn);
    }

    const ddChange = totalDDIn - totalDDOut;

    // Build inputs
    const inputs: TxInput[] = [];

    // DD inputs first
    for (const utxo of params.ddUtxos) {
      inputs.push({
        txid: utxo.txid,
        vout: utxo.vout,
        scriptSig: new Uint8Array(0),
        sequence: SEQUENCE_FINAL,
        witness: [],
      });
    }

    // Fee inputs after DD inputs
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
    const ddAmountsForOpReturn: bigint[] = [];

    // DD recipient outputs (zero value P2TR)
    for (const r of params.recipients) {
      const tokenScript = buildTokenP2TR(r.recipientPubKey);
      outputs.push({ value: 0n, scriptPubKey: tokenScript });
      ddAmountsForOpReturn.push(r.ddAmountCents);
    }

    // DD change output (if any)
    if (ddChange > 0n) {
      const changeScript = buildTokenP2TR(params.spenderPubKey);
      outputs.push({ value: 0n, scriptPubKey: changeScript });
      ddAmountsForOpReturn.push(ddChange);
    }

    // Calculate fee
    let totalFeeIn = 0n;
    for (const utxo of params.feeUtxos) {
      totalFeeIn += utxo.value;
    }

    // Estimate output count: recipients + ddChange? + dgbChange? + OP_RETURN
    const p2trOutputCount = params.recipients.length + (ddChange > 0n ? 1 : 0) + 1; // +1 for potential DGB change
    const totalOutputCount = p2trOutputCount + 1; // +1 for OP_RETURN
    const vsize = estimateVsize(inputs.length, totalOutputCount, p2trOutputCount, 1);
    let fee = calculateFee(vsize, params.feeRate);
    if (fee < MIN_DD_FEE) fee = MIN_DD_FEE;

    // DGB fee change output
    const dgbChange = totalFeeIn - fee;
    if (dgbChange >= DUST_THRESHOLD) {
      outputs.push({
        value: dgbChange,
        scriptPubKey: hexToBytes(params.changeDest),
      });
    } else if (dgbChange >= 0n) {
      // Small change absorbed into fee
      fee = totalFeeIn;
    } else {
      // This shouldn't happen if caller provides enough fee UTXOs
      throw new InvalidParamsError(
        `Insufficient fee funds: need ${fee} sats, have ${totalFeeIn} sats`,
      );
    }

    // OP_RETURN with all DD amounts (last output)
    const opReturnScript = encodeTransferOpReturn(ddAmountsForOpReturn);
    outputs.push({ value: 0n, scriptPubKey: opReturnScript });

    const unsignedTx: UnsignedTx = {
      version: DD_VERSION_TRANSFER,
      inputs,
      outputs,
      locktime: 0,
    };

    const tx = serializeTransaction(unsignedTx);
    const txid = computeTxid(unsignedTx);

    return { tx, txid, fee, unsignedTx };
  }
}
