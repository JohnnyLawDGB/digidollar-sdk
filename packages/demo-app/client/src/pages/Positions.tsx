import React from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { TxResult } from '../components/TxResult';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { usePositions } from '../hooks/usePositions';
import { useMutation } from '../hooks/useMutation';
import { formatDD, formatBlocks, truncateAddress } from '../lib/format';
import { TIER_DISPLAY } from '../lib/constants';
import type { RedeemResult } from '../api/types';

function healthStatus(ratio: number): string {
  if (ratio >= 200) return 'healthy';
  if (ratio >= 150) return 'warning';
  return 'critical';
}

export function Positions() {
  const { positions, loading, error, refetch } = usePositions();
  const { mutate, loading: redeeming, result: redeemResult } = useMutation<
    { positionId: string },
    RedeemResult
  >('/redeem');

  const handleRedeem = async (positionId: string) => {
    const res = await mutate({ positionId });
    if (res) refetch();
  };

  if (loading && positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Positions</h2>
        <p className="text-sm text-gray-500 mt-1">Active DigiDollar collateral positions</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {redeemResult && (
        <TxResult txid={redeemResult.txid} label="Redemption TX" />
      )}

      {positions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No active positions</p>
          <p className="text-sm text-gray-600 mt-1">
            Mint DigiDollars to create your first position
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-left">
                <th className="pb-3 pr-4 font-medium">Position</th>
                <th className="pb-3 pr-4 font-medium">DD Minted</th>
                <th className="pb-3 pr-4 font-medium">Collateral</th>
                <th className="pb-3 pr-4 font-medium">Tier</th>
                <th className="pb-3 pr-4 font-medium">Health</th>
                <th className="pb-3 pr-4 font-medium">Remaining</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const tierInfo = TIER_DISPLAY[p.lock_tier];
                return (
                  <tr key={p.position_id} className="border-b border-gray-800/50">
                    <td className="py-3 pr-4">
                      <code className="text-xs text-gray-400">
                        {truncateAddress(p.position_id, 6)}
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-white">${formatDD(p.dd_minted)}</td>
                    <td className="py-3 pr-4 text-gray-300">{parseFloat(p.dgb_collateral).toLocaleString()} DGB</td>
                    <td className="py-3 pr-4 text-gray-300">{tierInfo?.label ?? `Tier ${p.lock_tier}`}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={healthStatus(p.health_ratio)} />
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {p.blocks_remaining > 0
                        ? `${formatBlocks(p.blocks_remaining)} blocks`
                        : 'Unlocked'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleRedeem(p.position_id)}
                        disabled={!p.can_redeem || redeeming}
                        className="px-3 py-1 text-xs font-medium rounded bg-dgb-blue text-dgb-accent hover:bg-dgb-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Redeem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
