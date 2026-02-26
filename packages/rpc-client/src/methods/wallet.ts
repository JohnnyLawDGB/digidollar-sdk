import type { Transport } from '../transport.js';
import type { DDAddressInfo, DDAddressValidation, ImportAddressResult } from '../types/wallet.js';
import type { ListAddressesParams, ImportAddressParams } from '../types/params.js';

export interface WalletMethods {
  /** Get a new DigiDollar address (wallet context) */
  getAddress(label?: string): Promise<string>;

  /** Validate a DigiDollar address */
  validateAddress(address: string): Promise<DDAddressValidation>;

  /** List DigiDollar addresses */
  listAddresses(params?: ListAddressesParams): Promise<DDAddressInfo[]>;

  /** Import a DigiDollar address for watching */
  importAddress(params: ImportAddressParams): Promise<ImportAddressResult>;
}

export function createWalletMethods(transport: Transport): WalletMethods {
  return {
    getAddress(label?: string) {
      const args: unknown[] = [];
      if (label !== undefined) args.push(label);
      return transport.call<string>('getdigidollaraddress', args, true);
    },

    validateAddress(address: string) {
      return transport.call<DDAddressValidation>('validateddaddress', [address]);
    },

    listAddresses(params?: ListAddressesParams) {
      const args: unknown[] = [];
      if (params?.includeWatchonly !== undefined) {
        args.push(params.includeWatchonly);
      } else if (params?.minBalance !== undefined) {
        args.push(false); // default includeWatchonly
      }
      if (params?.minBalance !== undefined) args.push(params.minBalance);
      return transport.call<DDAddressInfo[]>('listdigidollaraddresses', args);
    },

    importAddress(params: ImportAddressParams) {
      const args: unknown[] = [params.address];
      if (params.label !== undefined) {
        args.push(params.label);
      } else if (params.rescan !== undefined || params.p2sh !== undefined) {
        args.push(''); // default label
      }
      if (params.rescan !== undefined) {
        args.push(params.rescan);
      } else if (params.p2sh !== undefined) {
        args.push(false); // default rescan
      }
      if (params.p2sh !== undefined) args.push(params.p2sh);
      return transport.call<ImportAddressResult>('importdigidollaraddress', args);
    },
  };
}
