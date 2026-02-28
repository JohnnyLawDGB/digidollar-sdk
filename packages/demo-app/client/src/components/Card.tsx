import React from 'react';

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}

export function Card({ label, value, sub, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold mt-1 text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
