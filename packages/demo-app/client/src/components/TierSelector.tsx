import React from 'react';
import { TIER_DISPLAY } from '../lib/constants';

interface TierSelectorProps {
  value: number;
  onChange: (tier: number) => void;
}

export function TierSelector({ value, onChange }: TierSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">Lock Tier</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TIER_DISPLAY.map((t) => (
          <button
            key={t.tier}
            type="button"
            onClick={() => onChange(t.tier)}
            className={`rounded-lg border p-2 text-left transition-colors ${
              value === t.tier
                ? 'border-dgb-accent bg-dgb-blue/30 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="text-sm font-medium">{t.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{t.ratio}% ratio</div>
          </button>
        ))}
      </div>
    </div>
  );
}
