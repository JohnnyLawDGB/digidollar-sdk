import React from 'react';

const colors = {
  success: 'bg-green-900/80 border-green-500 text-green-100',
  error: 'bg-red-900/80 border-red-500 text-red-100',
  info: 'bg-blue-900/80 border-blue-500 text-blue-100',
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 shadow-lg max-w-sm cursor-pointer ${colors[type]}`}
      onClick={onDismiss}
    >
      <p className="text-sm">{message}</p>
    </div>
  );
}
