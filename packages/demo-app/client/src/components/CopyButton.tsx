import React, { useState, useCallback } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={copy}
      className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
