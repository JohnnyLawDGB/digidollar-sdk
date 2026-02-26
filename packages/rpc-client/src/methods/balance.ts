import type { Transport } from '../transport.js';
import type { DDBalance } from '../types/balance.js';
import type { GetBalanceParams } from '../types/params.js';

export interface BalanceMethods {
  /** Get DigiDollar balance for the wallet or a specific address */
  getBalance(params?: GetBalanceParams): Promise<DDBalance>;
}

export function createBalanceMethods(transport: Transport): BalanceMethods {
  return {
    getBalance(params?: GetBalanceParams) {
      const args: unknown[] = [];
      if (params?.address !== undefined) {
        args.push(params.address);
      } else if (params?.minconf !== undefined || params?.includeWatchonly !== undefined) {
        args.push(''); // placeholder for address
      }
      if (params?.minconf !== undefined) {
        args.push(params.minconf);
      } else if (params?.includeWatchonly !== undefined) {
        args.push(1); // default minconf
      }
      if (params?.includeWatchonly !== undefined) {
        args.push(params.includeWatchonly);
      }
      return transport.call<DDBalance>('getdigidollarbalance', args, true);
    },
  };
}
