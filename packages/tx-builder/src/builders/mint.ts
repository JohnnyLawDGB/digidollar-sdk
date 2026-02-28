/**
 * MintBuilder — constructs unsigned DD mint transactions.
 *
 * Ports txbuilder.cpp:280-431.
 *
 * Outputs:
 *   [0] Collateral — P2TR MAST (NUMS internal key, Normal + ERR leaves)
 *   [1] DD token — P2TR key-path (zero value)
 *   [2] OP_RETURN — DD metadata
 *   [3] DGB change (optional, if above dust)
 */

import { hexToBytes } from '@digidollar/tx-parser';
import { DD_VERSION_MINT, DUST_THRESHOLD, SEQUENCE_FINAL, MIN_DD_FEE } from '../constants.js';
import { InvalidParamsError } from '../errors.js';
import { calculateCollateral, getCollateralRatio, lockTierToBlocks } from '../collateral.js';
import { selectCoins } from '../coin-select.js';
import { estimateVsize, calculateFee } from '../fee.js';
import { buildCollateralMAST, buildTokenP2TR } from '../taproot/mast.js';
import { encodeMintOpReturn } from '../op-return-encode.js';
import { serializeTransaction, computeTxid } from '../tx/serialize.js';
import type { MintParams, BuilderResult, TxInput, TxOutput, UnsignedTx } from '../types.js';

export class MintBuilder {
  static build(params: MintParams): BuilderResult {
    // Validate parameters
    if (params.ddAmountCents <= 0n) throw new InvalidParamsError('DD amount must be positive');
    if (params.lockTier < 0 || params.lockTier > 9) throw new InvalidParamsError('Lock tier must be 0-9');
    if (params.ownerPubKey.length !== 32) throw new InvalidParamsError('Owner public key must be 32 bytes');
    if (params.oraclePriceMicroUsd <= 0n) throw new InvalidParamsError('Oracle price must be positive');
    if (params.currentHeight < 0) throw new InvalidParamsError('Current height must be non-negative');

    // Calculate lock height and collateral
    const lockBlocks = lockTierToBlocks(params.lockTier);
    const lockHeight = params.currentHeight + lockBlocks;
    const ratioPercent = getCollateralRatio(params.lockTier);
    const collateralSats = calculateCollateral(
      params.ddAmountCents,
      params.oraclePriceMicroUsd,
      ratioPercent,
    );

    // Estimate fee for initial coin selection
    // Mint tx: ~2-3 inputs, 4 outputs (collateral, token, OP_RETURN, change)
    const estimatedVsize = estimateVsize(3, 4, 2, 1);
    const estimatedFee = calculateFee(estimatedVsize, params.feeRate);
    const minFee = MIN_DD_FEE > estimatedFee ? MIN_DD_FEE : estimatedFee;

    // Select coins for collateral + fee
    const { selected, total: totalIn } = selectCoins(params.utxos, collateralSats + minFee);

    // Build inputs
    const inputs: TxInput[] = selected.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      scriptSig: new Uint8Array(0),
      sequence: SEQUENCE_FINAL,
      witness: [],
    }));

    // Build outputs
    const outputs: TxOutput[] = [];

    // [0] Collateral output — P2TR MAST
    const collateralData = buildCollateralMAST(params.ownerPubKey, lockHeight);
    outputs.push({
      value: collateralSats,
      scriptPubKey: collateralData.scriptPubKey,
    });

    // [1] DD token output — P2TR key-path (zero value)
    const tokenScript = buildTokenP2TR(params.ownerPubKey);
    outputs.push({
      value: 0n,
      scriptPubKey: tokenScript,
    });

    // [2] OP_RETURN metadata
    const opReturnScript = encodeMintOpReturn(
      params.ddAmountCents,
      BigInt(lockHeight),
      BigInt(params.lockTier),
      params.ownerPubKey,
    );
    outputs.push({
      value: 0n,
      scriptPubKey: opReturnScript,
    });

    // Calculate actual fee with correct input count
    const actualVsize = estimateVsize(inputs.length, 4, 2, 1);
    let fee = calculateFee(actualVsize, params.feeRate);
    if (fee < MIN_DD_FEE) fee = MIN_DD_FEE;

    // [3] DGB change output (if above dust)
    const change = totalIn - collateralSats - fee;
    if (change >= DUST_THRESHOLD) {
      outputs.push({
        value: change,
        scriptPubKey: hexToBytes(params.changeDest),
      });
    } else {
      // Small change absorbed into fee
      fee = totalIn - collateralSats;
    }

    const unsignedTx: UnsignedTx = {
      version: DD_VERSION_MINT,
      inputs,
      outputs,
      locktime: 0,
    };

    const tx = serializeTransaction(unsignedTx);
    const txid = computeTxid(unsignedTx);

    return { tx, txid, fee, unsignedTx };
  }
}
