import type { Request, Response, NextFunction } from 'express';
import {
  CoreError,
  StalePriceError,
  InsufficientFundsError,
  InsufficientDDError,
  PositionError,
  AddressError,
  BackendError,
  NoSignerError,
} from '@digidollar/core';

interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

function mapError(err: CoreError): { status: number; body: ErrorResponse } {
  if (err instanceof StalePriceError) {
    return { status: 503, body: { error: err.message, code: 'STALE_PRICE' } };
  }
  if (err instanceof InsufficientFundsError) {
    return {
      status: 400,
      body: {
        error: err.message,
        code: 'INSUFFICIENT_FUNDS',
        details: { required: `${err.required}n`, available: `${err.available}n` },
      },
    };
  }
  if (err instanceof InsufficientDDError) {
    return {
      status: 400,
      body: {
        error: err.message,
        code: 'INSUFFICIENT_DD',
        details: { required: `${err.required}n`, available: `${err.available}n` },
      },
    };
  }
  if (err instanceof PositionError) {
    return { status: 400, body: { error: err.message, code: 'POSITION_ERROR' } };
  }
  if (err instanceof AddressError) {
    return { status: 400, body: { error: err.message, code: 'INVALID_ADDRESS' } };
  }
  if (err instanceof BackendError) {
    return { status: 502, body: { error: err.message, code: 'BACKEND_ERROR' } };
  }
  if (err instanceof NoSignerError) {
    return { status: 500, body: { error: err.message, code: 'NO_SIGNER' } };
  }
  return { status: 500, body: { error: err.message, code: 'UNKNOWN_ERROR' } };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof CoreError) {
    const { status, body } = mapError(err);
    res.status(status).json(body);
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
