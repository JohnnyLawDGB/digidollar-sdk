import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useStatus } from '../hooks/useStatus';
import { formatOraclePrice, formatDGB, formatDD, formatBlocks } from '../lib/format';
import { api } from '../api/client';
import type { AddressResponse } from '../api/types';

export function Dashboard() {
  const { data, error, loading } = useStatus();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    api.get<AddressResponse>('/address').then((r) => setAddress(r.address)).catch(() => {});
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-400">Failed to connect to testnet node</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { oracle, height, stats, balance } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">DigiDollar testnet overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          label="Oracle Price"
          value={formatOraclePrice(oracle.priceMicroUsd)}
          sub={oracle.isStale ? 'STALE' : `${oracle.oracleCount} oracles reporting`}
        />
        <Card
          label="Block Height"
          value={formatBlocks(height)}
        />
        <Card
          label="DGB Balance"
          value={`${formatDGB(balance.confirmed)} DGB`}
          sub={balance.unconfirmed !== '0' ? `+${balance.unconfirmed} unconfirmed` : undefined}
        />
        <Card
          label="DD Balance"
          value={`$${formatDD(balance.total)}`}
          sub="DigiDollars"
        />
      </div>

      {/* System health */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">System Health</h3>
          <StatusBadge status={stats.health_status} />
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Health</span>
              <span>{stats.health_percentage}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.health_percentage >= 200
                    ? 'bg-green-500'
                    : stats.health_percentage >= 150
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, stats.health_percentage / 5)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Collateral Ratio</p>
              <p className="text-white">{stats.system_collateral_ratio}%</p>
            </div>
            <div>
              <p className="text-gray-500">Active Positions</p>
              <p className="text-white">{stats.active_positions}</p>
            </div>
            <div>
              <p className="text-gray-500">Total DD Supply</p>
              <p className="text-white">${formatDD(stats.total_dd_supply)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Collateral</p>
              <p className="text-white">{stats.total_collateral_dgb.toLocaleString()} DGB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet address */}
      {address && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Wallet Address</h3>
          <div className="flex items-center gap-2">
            <code className="text-sm text-dgb-accent break-all flex-1">{address}</code>
            <CopyButton text={address} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Send testnet DGB to this address to fund the demo wallet
          </p>
        </div>
      )}
    </div>
  );
}
