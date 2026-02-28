import React, { useState } from 'react';
import { TxResult } from '../components/TxResult';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useMutation } from '../hooks/useMutation';
import { useBalance } from '../hooks/useBalance';
import { formatDD } from '../lib/format';
import type { TransferResult } from '../api/types';

export function Transfer() {
  const [toAddress, setToAddress] = useState('');
  const [dollars, setDollars] = useState('');
  const { data: balanceData } = useBalance();

  const amountCents = Math.round(parseFloat(dollars || '0') * 100);
  const { mutate, loading, result, reset } = useMutation<
    { toAddress: string; amount: number },
    TransferResult
  >('/transfer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toAddress || !amountCents || loading) return;
    await mutate({ toAddress, amount: amountCents });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Transfer DigiDollars</h2>
        <p className="text-sm text-gray-500 mt-1">
          Send DD to another DigiDollar address
        </p>
      </div>

      {balanceData && (
        <div className="text-sm text-gray-400">
          Available: <span className="text-white font-medium">${formatDD(balanceData.ddBalance)}</span> DD
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300">Recipient Address</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => { setToAddress(e.target.value); reset(); }}
            placeholder="TD1..."
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-dgb-accent focus:outline-none font-mono text-sm"
          />
        </div>

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
              placeholder="50.00"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-dgb-accent focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!toAddress || !amountCents || loading}
          className="w-full bg-dgb-light hover:bg-dgb-accent text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <LoadingSpinner className="w-4 h-4" />}
          {loading ? 'Sending...' : 'Send DigiDollars'}
        </button>
      </form>

      {result && <TxResult txid={result.txid} />}
    </div>
  );
}
