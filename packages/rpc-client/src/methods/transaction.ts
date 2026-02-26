import type { Transport } from '../transport.js';
import type { MintResult, SendResult, RedeemResult, DDTransaction } from '../types/transaction.js';
import type { MintParams, SendParams, RedeemParams, ListTransactionsParams } from '../types/params.js';

export interface TransactionMethods {
  /** Mint DigiDollars by locking DGB collateral */
  mint(params: MintParams): Promise<MintResult>;

  /** Send DigiDollars to another DD address */
  send(params: SendParams): Promise<SendResult>;

  /** Redeem DigiDollars to unlock DGB collateral */
  redeem(params: RedeemParams): Promise<RedeemResult>;

  /** List DigiDollar transactions */
  listTransactions(params?: ListTransactionsParams): Promise<DDTransaction[]>;
}

export function createTransactionMethods(transport: Transport): TransactionMethods {
  return {
    mint(params: MintParams) {
      const args: unknown[] = [params.ddAmountCents, params.lockTier];
      if (params.feeRate !== undefined) args.push(params.feeRate);
      return transport.call<MintResult>('mintdigidollar', args, true);
    },

    send(params: SendParams) {
      const args: unknown[] = [params.address, params.amountCents];
      if (params.comment !== undefined) {
        args.push(params.comment);
      } else if (params.feeRate !== undefined) {
        args.push(''); // placeholder for comment
      }
      if (params.feeRate !== undefined) args.push(params.feeRate);
      return transport.call<SendResult>('senddigidollar', args, true);
    },

    redeem(params: RedeemParams) {
      const args: unknown[] = [params.positionId, params.ddAmountCents];
      if (params.redemptionAddress !== undefined) {
        args.push(params.redemptionAddress);
      } else if (params.feeRate !== undefined) {
        args.push(''); // placeholder
      }
      if (params.feeRate !== undefined) args.push(params.feeRate);
      return transport.call<RedeemResult>('redeemdigidollar', args, true);
    },

    listTransactions(params?: ListTransactionsParams) {
      const args: unknown[] = [];
      if (params?.count !== undefined) {
        args.push(params.count);
      } else if (params?.skip !== undefined || params?.address !== undefined || params?.category !== undefined) {
        args.push(10); // default count
      }
      if (params?.skip !== undefined) {
        args.push(params.skip);
      } else if (params?.address !== undefined || params?.category !== undefined) {
        args.push(0); // default skip
      }
      if (params?.address !== undefined) {
        args.push(params.address);
      } else if (params?.category !== undefined) {
        args.push(''); // placeholder
      }
      if (params?.category !== undefined) args.push(params.category);
      return transport.call<DDTransaction[]>('listdigidollartxs', args, true);
    },
  };
}
