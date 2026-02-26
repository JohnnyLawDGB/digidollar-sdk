import type { Transport } from '../transport.js';
import type { DDPosition, RedemptionInfo, CollateralEstimate, CollateralRequirement } from '../types/position.js';
import type { ListPositionsParams, CalculateCollateralParams, EstimateCollateralParams } from '../types/params.js';

export interface PositionMethods {
  /** List DigiDollar positions in the wallet */
  listPositions(params?: ListPositionsParams): Promise<DDPosition[]>;

  /** Get redemption info for a specific position */
  getRedemptionInfo(positionId: string, ddAmountCents?: number): Promise<RedemptionInfo>;

  /** Calculate collateral requirement for a mint (by lock days) */
  calculateCollateral(params: CalculateCollateralParams): Promise<CollateralRequirement>;

  /** Estimate collateral for a mint (by lock tier) */
  estimateCollateral(params: EstimateCollateralParams): Promise<CollateralEstimate>;
}

export function createPositionMethods(transport: Transport): PositionMethods {
  return {
    listPositions(params?: ListPositionsParams) {
      const args: unknown[] = [];
      if (params?.activeOnly !== undefined) {
        args.push(params.activeOnly);
      } else if (params?.tierFilter !== undefined || params?.minAmount !== undefined) {
        args.push(true); // default activeOnly
      }
      if (params?.tierFilter !== undefined) {
        args.push(params.tierFilter);
      } else if (params?.minAmount !== undefined) {
        args.push(null); // no tier filter
      }
      if (params?.minAmount !== undefined) args.push(params.minAmount);
      return transport.call<DDPosition[]>('listdigidollarpositions', args, true);
    },

    getRedemptionInfo(positionId: string, ddAmountCents?: number) {
      const args: unknown[] = [positionId];
      if (ddAmountCents !== undefined) args.push(ddAmountCents);
      return transport.call<RedemptionInfo>('getredemptioninfo', args);
    },

    calculateCollateral(params: CalculateCollateralParams) {
      const args: unknown[] = [params.ddAmountCents, params.lockDays];
      if (params.oraclePrice !== undefined) args.push(params.oraclePrice);
      return transport.call<CollateralRequirement>('calculatecollateralrequirement', args);
    },

    estimateCollateral(params: EstimateCollateralParams) {
      const args: unknown[] = [params.ddAmount, params.lockTier];
      if (params.oraclePriceMicroUsd !== undefined) args.push(params.oraclePriceMicroUsd);
      return transport.call<CollateralEstimate>('estimatecollateral', args);
    },
  };
}
