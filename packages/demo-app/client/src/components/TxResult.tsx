import React from 'react';
import { CopyButton } from './CopyButton';

interface TxResultProps {
  txid: string;
  label?: string;
}

export function TxResult({ txid, label = 'Transaction ID' }: TxResultProps) {
  return (
    <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
      <p className="text-xs text-green-400 font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-sm text-green-200 break-all flex-1">{txid}</code>
        <CopyButton text={txid} />
      </div>
    </div>
  );
}
