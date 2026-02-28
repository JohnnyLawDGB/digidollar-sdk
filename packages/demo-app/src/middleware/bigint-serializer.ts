import type { Response } from 'express';

export function bigintReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return `${value}n`;
  return value;
}

export function sendJson(res: Response, data: unknown, status = 200): void {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data, bigintReplacer));
}
