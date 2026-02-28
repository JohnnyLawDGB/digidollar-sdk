import type { Transport } from '../transport.js';
import type { ListUnspentEntry, DecodedRawTransaction } from '../types/blockchain.js';

export interface BlockchainMethods {
  /** List unspent transaction outputs */
  listUnspent(minconf?: number, maxconf?: number, addresses?: string[]): Promise<ListUnspentEntry[]>;

  /** Get raw transaction (verbose=true returns decoded, verbose=false returns hex string) */
  getRawTransaction(txid: string, verbose?: boolean): Promise<string | DecodedRawTransaction>;

  /** Broadcast a signed transaction, returns txid */
  sendRawTransaction(hexstring: string): Promise<string>;

  /** Get current block count (chain height) */
  getBlockCount(): Promise<number>;
}

export function createBlockchainMethods(transport: Transport): BlockchainMethods {
  return {
    listUnspent(minconf?: number, maxconf?: number, addresses?: string[]) {
      const args: unknown[] = [];
      if (minconf !== undefined) args.push(minconf);
      else if (maxconf !== undefined || addresses !== undefined) args.push(1);
      if (maxconf !== undefined) args.push(maxconf);
      else if (addresses !== undefined) args.push(9999999);
      if (addresses !== undefined) args.push(addresses);
      return transport.call<ListUnspentEntry[]>('listunspent', args, true);
    },

    getRawTransaction(txid: string, verbose?: boolean) {
      const args: unknown[] = [txid];
      if (verbose !== undefined) args.push(verbose);
      return transport.call<string | DecodedRawTransaction>('getrawtransaction', args);
    },

    sendRawTransaction(hexstring: string) {
      return transport.call<string>('sendrawtransaction', [hexstring]);
    },

    getBlockCount() {
      return transport.call<number>('getblockcount');
    },
  };
}
