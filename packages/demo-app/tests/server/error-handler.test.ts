import { describe, it, expect, vi } from 'vitest';

// Mock the @digidollar/core module
vi.mock('@digidollar/core', () => {
  class CoreError extends Error {
    constructor(message: string) { super(message); this.name = 'CoreError'; }
  }
  class StalePriceError extends CoreError {
    priceAgeSecs: number;
    constructor(msg: string, age: number) { super(msg); this.priceAgeSecs = age; }
  }
  class InsufficientFundsError extends CoreError {
    required: bigint;
    available: bigint;
    constructor(msg: string, req: bigint, avail: bigint) {
      super(msg); this.required = req; this.available = avail;
    }
  }
  class InsufficientDDError extends CoreError {
    required: bigint;
    available: bigint;
    constructor(msg: string, req: bigint, avail: bigint) {
      super(msg); this.required = req; this.available = avail;
    }
  }
  class PositionError extends CoreError {}
  class AddressError extends CoreError {}
  class BackendError extends CoreError {}
  class NoSignerError extends CoreError {}
  return {
    CoreError,
    StalePriceError,
    InsufficientFundsError,
    InsufficientDDError,
    PositionError,
    AddressError,
    BackendError,
    NoSignerError,
  };
});

// Import after mock
const { errorHandler } = await import('../../src/middleware/error-handler.js');
const { StalePriceError, BackendError } = await import('@digidollar/core');

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('maps StalePriceError to 503', () => {
    const err = new StalePriceError('stale', 120);
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'STALE_PRICE' })
    );
  });

  it('maps BackendError to 502', () => {
    const err = new BackendError('connection failed');
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'BACKEND_ERROR' })
    );
  });

  it('maps unknown errors to 500', () => {
    const err = new Error('random');
    const res = mockRes();
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR' })
    );
  });
});
