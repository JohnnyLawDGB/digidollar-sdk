import type { Request, Response, NextFunction } from 'express';
import { RPCError } from '../rpc.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof RPCError) {
    // Map common RPC error codes
    const status = err.code === -1 ? 502        // auth / connection
      : err.code === -6 ? 400                   // insufficient funds
      : err.code === -5 ? 400                   // invalid address
      : err.code === -8 ? 400                   // invalid parameter
      : err.code === -32600 ? 400               // invalid request
      : 502;                                    // other RPC errors → bad gateway

    res.status(status).json({
      error: err.message,
      code: `RPC_${err.code}`,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
