import { describe, it, expect, vi } from 'vitest';

// Import RPCError directly (no env dependency)
class RPCError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    this.name = 'RPCError';
  }
}

// Mock the rpc module to avoid env validation at import time
vi.mock('../../src/rpc.js', () => ({
  RPCError,
}));

const { errorHandler } = await import('../../src/middleware/error-handler.js');

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('maps RPC insufficient funds (-6) to 400', () => {
    const err = new RPCError('Insufficient funds', -6);
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RPC_-6' })
    );
  });

  it('maps RPC auth error (-1) to 502', () => {
    const err = new RPCError('RPC authentication failed', -1);
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it('maps RPC invalid address (-5) to 400', () => {
    const err = new RPCError('Invalid address', -5);
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('maps unknown RPC errors to 502', () => {
    const err = new RPCError('Some RPC error', -99);
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it('maps non-RPC errors to 500', () => {
    const err = new Error('random');
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' })
    );
  });
});
