/**
 * UTXO Manager — queries, classifies, and partitions UTXOs.
 *
 * Flow:
 * 1. backend.listUnspent() → raw UTXOs
 * 2. Collect unique txids, batchGetTransactions() → decoded txs
 * 3. classifyTransaction() for each → classified outputs
 * 4. Match raw UTXO (txid:vout) to classified output
 * 5. Partition into standard, ddTokens, ddCollateral
 */

import { classifyTransaction } from '@digidollar/tx-parser';
import type { DecodedTx } from '@digidollar/tx-parser';
import type { UTXO, DDTokenUTXO } from '@digidollar/tx-builder';
import type { Backend } from '../backend/interface.js';
import type { ClassifiedUTXOSet } from './types.js';

export class UTXOManager {
  constructor(private readonly backend: Backend) {}

  /** Fetch and classify all UTXOs for the wallet */
  async getClassifiedUTXOs(minconf?: number): Promise<ClassifiedUTXOSet> {
    // 1. Fetch raw UTXOs
    const rawUtxos = await this.backend.listUnspent(minconf ?? 1);

    if (rawUtxos.length === 0) {
      return { standard: [], ddTokens: [], ddCollateral: [], standardBalance: 0n, ddBalance: 0n };
    }

    // 2. Collect unique txids
    const txids = [...new Set(rawUtxos.map(u => u.txid))];

    // 3. Batch-fetch decoded transactions
    const txMap = await this.backend.batchGetTransactions(txids);

    // 4. Classify each transaction and build lookup
    const classifiedMap = new Map<string, Map<number, { classification: string; ddAmountCents?: bigint }>>();

    for (const [txid, decodedRaw] of txMap) {
      // Convert DecodedRawTransaction to the DecodedTx format tx-parser expects
      const decodedTx = decodedRaw as unknown as DecodedTx;
      const classified = classifyTransaction(decodedTx);
      const outputMap = new Map<number, { classification: string; ddAmountCents?: bigint }>();
      for (const output of classified.outputs) {
        outputMap.set(output.index, {
          classification: output.classification,
          ddAmountCents: output.ddAmountCents,
        });
      }
      classifiedMap.set(txid, outputMap);
    }

    // 5. Partition raw UTXOs
    const standard: UTXO[] = [];
    const ddTokens: DDTokenUTXO[] = [];
    const ddCollateral: UTXO[] = [];
    let standardBalance = 0n;
    let ddBalance = 0n;

    for (const raw of rawUtxos) {
      const outputInfo = classifiedMap.get(raw.txid)?.get(raw.vout);
      const baseUtxo: UTXO = {
        txid: raw.txid,
        vout: raw.vout,
        value: raw.valueSats,
        scriptPubKey: raw.scriptPubKey,
      };

      if (!outputInfo || outputInfo.classification === 'standard') {
        standard.push(baseUtxo);
        standardBalance += raw.valueSats;
      } else if (outputInfo.classification === 'dd_token') {
        ddTokens.push({
          ...baseUtxo,
          ddAmountCents: outputInfo.ddAmountCents ?? 0n,
        });
        ddBalance += outputInfo.ddAmountCents ?? 0n;
      } else if (outputInfo.classification === 'dd_collateral') {
        ddCollateral.push(baseUtxo);
      }
      // dd_metadata outputs are not spendable, skip
    }

    return { standard, ddTokens, ddCollateral, standardBalance, ddBalance };
  }

  /** Convenience: get only standard (spendable) UTXOs */
  async getStandardUTXOs(minconf?: number): Promise<UTXO[]> {
    const set = await this.getClassifiedUTXOs(minconf);
    return set.standard;
  }

  /** Convenience: get only DD token UTXOs */
  async getDDTokenUTXOs(minconf?: number): Promise<DDTokenUTXO[]> {
    const set = await this.getClassifiedUTXOs(minconf);
    return set.ddTokens;
  }
}
