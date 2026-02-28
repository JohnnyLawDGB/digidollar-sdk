import React, { useState } from 'react';
import { TierSelector } from '../components/TierSelector';
import { TxResult } from '../components/TxResult';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useEstimate } from '../hooks/useEstimate';
import { useMutation } from '../hooks/useMutation';
import { formatDGB, formatDD } from '../lib/format';
import { TIER_DISPLAY } from '../lib/constants';
import type { MintResult } from '../api/types';

export function Mint() {
  const [dollars, setDollars] = useState('');
  const [tier, setTier] = useState(1);

  const amountCents = Math.round(parseFloat(dollars || '0') * 100);
  const { estimate, loading: estimating } = useEstimate(amountCents, tier);
  const { mutate, loading, result, reset } = useMutation<
    { amount: number; tier: number },
    MintResult
  >('/mint');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountCents || loading) return;
    await mutate({ amount: amountCents, tier });
  };

  const tierInfo = TIER_DISPLAY[tier];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mint DigiDollars</h2>
        <p className="text-sm text-gray-500 mt-1">
          Lock DGB collateral to mint DD stablecoins
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount input */}
        <div>
          <label className="text-sm font-medium text-gray-300">DD Amount (dollars)</label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={dollars}
              onChange={(e) => { setDollars(e.target.value); reset(); }}
              placeholder="100.00"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-dgb-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Tier selector */}
        <TierSelector value={tier} onChange={(t) => { setTier(t); reset(); }} />

        {/* Collateral estimate */}
        {amountCents > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Collateral Estimate</h3>
            {estimating ? (
              <LoadingSpinner />
            ) : estimate ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Required DGB</p>
                  <p className="text-white font-medium">{parseFloat(estimate.required_dgb).toLocaleString()} DGB</p>
                </div>
                <div>
                  <p className="text-gray-500">Lock Period</p>
                  <p className="text-white">{tierInfo?.label}</p>
                </div>
                <div>
                  <p className="text-gray-500">Effective Ratio</p>
                  <p className="text-white">{estimate.effective_ratio}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Oracle Price</p>
                  <p className="text-white">${estimate.oracle_price_usd?.toFixed(6)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Enter an amount to see estimate</p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!amountCents || loading}
          className="w-full bg-dgb-light hover:bg-dgb-accent text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <LoadingSpinner className="w-4 h-4" />}
          {loading ? 'Minting...' : 'Mint DigiDollars'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="space-y-2">
          <TxResult txid={result.txid} />
          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div>
              <p className="text-gray-500">DD Minted</p>
              <p className="text-white">${formatDD(result.ddMintedCents)}</p>
            </div>
            <div>
              <p className="text-gray-500">Collateral Locked</p>
              <p className="text-white">{formatDGB(result.collateralSats)} DGB</p>
            </div>
            <div>
              <p className="text-gray-500">Fee</p>
              <p className="text-white">{formatDGB(result.feeSats)} DGB</p>
            </div>
            <div>
              <p className="text-gray-500">Unlock Height</p>
              <p className="text-white">{result.unlockHeight.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
