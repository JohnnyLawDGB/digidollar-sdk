import React from 'react';

const styles: Record<string, string> = {
  healthy: 'bg-green-900/50 text-green-400 border-green-700',
  warning: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  critical: 'bg-red-900/50 text-red-400 border-red-700',
  emergency: 'bg-red-900/80 text-red-300 border-red-600',
  active: 'bg-green-900/50 text-green-400 border-green-700',
  unlocked: 'bg-blue-900/50 text-blue-400 border-blue-700',
  redeemed: 'bg-gray-800 text-gray-400 border-gray-700',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] || 'bg-gray-800 text-gray-400 border-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}
