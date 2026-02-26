import { describe, it, expect } from 'vitest';
import {
  DigiDollarError,
  ConnectionError,
  TimeoutError,
  AuthenticationError,
  RPCError,
  DigiDollarNotActiveError,
  InvalidParameterError,
  InvalidAddressError,
  InsufficientFundsError,
  WalletLockedError,
  WalletNotFoundError,
  OraclePriceUnavailableError,
  WalletError,
  MethodNotAvailableError,
  mapRPCError,
} from '../../src/errors.js';

describe('Error hierarchy', () => {
  it('DigiDollarError is base', () => {
    const err = new DigiDollarError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('DigiDollarError');
    expect(err.message).toBe('test');
  });

  it('ConnectionError extends DigiDollarError', () => {
    const err = new ConnectionError('no host');
    expect(err).toBeInstanceOf(DigiDollarError);
    expect(err.name).toBe('ConnectionError');
  });

  it('TimeoutError extends ConnectionError', () => {
    const err = new TimeoutError(5000);
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err).toBeInstanceOf(DigiDollarError);
    expect(err.name).toBe('TimeoutError');
    expect(err.message).toContain('5000ms');
  });

  it('AuthenticationError extends ConnectionError', () => {
    const err = new AuthenticationError();
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err.name).toBe('AuthenticationError');
  });

  it('RPCError has code and rpcMessage', () => {
    const err = new RPCError(-8, 'bad param');
    expect(err).toBeInstanceOf(DigiDollarError);
    expect(err.code).toBe(-8);
    expect(err.rpcMessage).toBe('bad param');
    expect(err.message).toContain('-8');
    expect(err.message).toContain('bad param');
  });

  it('specific RPC errors extend RPCError', () => {
    expect(new DigiDollarNotActiveError('msg')).toBeInstanceOf(RPCError);
    expect(new InvalidParameterError('msg')).toBeInstanceOf(RPCError);
    expect(new InvalidAddressError('msg')).toBeInstanceOf(RPCError);
    expect(new InsufficientFundsError('msg')).toBeInstanceOf(RPCError);
    expect(new WalletLockedError('msg')).toBeInstanceOf(RPCError);
    expect(new WalletNotFoundError('msg')).toBeInstanceOf(RPCError);
    expect(new OraclePriceUnavailableError('msg')).toBeInstanceOf(RPCError);
    expect(new WalletError('msg')).toBeInstanceOf(RPCError);
    expect(new MethodNotAvailableError('msg')).toBeInstanceOf(RPCError);
  });
});

describe('mapRPCError', () => {
  it('maps code -5 to InvalidAddressError', () => {
    const err = mapRPCError(-5, 'Invalid address');
    expect(err).toBeInstanceOf(InvalidAddressError);
    expect(err.code).toBe(-5);
  });

  it('maps code -6 to InsufficientFundsError', () => {
    const err = mapRPCError(-6, 'Not enough DGB');
    expect(err).toBeInstanceOf(InsufficientFundsError);
  });

  it('maps code -8 to InvalidParameterError', () => {
    const err = mapRPCError(-8, 'Invalid lock tier');
    expect(err).toBeInstanceOf(InvalidParameterError);
  });

  it('maps code -13 to WalletLockedError', () => {
    const err = mapRPCError(-13, 'wallet locked');
    expect(err).toBeInstanceOf(WalletLockedError);
  });

  it('maps code -18 to WalletNotFoundError', () => {
    const err = mapRPCError(-18, 'wallet not found');
    expect(err).toBeInstanceOf(WalletNotFoundError);
  });

  it('maps code -4 to WalletError', () => {
    const err = mapRPCError(-4, 'DD wallet not initialized');
    expect(err).toBeInstanceOf(WalletError);
  });

  it('maps code -32601 to MethodNotAvailableError', () => {
    const err = mapRPCError(-32601, 'Method not found');
    expect(err).toBeInstanceOf(MethodNotAvailableError);
  });

  it('maps code -1 with activation keywords to DigiDollarNotActiveError', () => {
    const err = mapRPCError(-1, 'DigiDollar is not active');
    expect(err).toBeInstanceOf(DigiDollarNotActiveError);
  });

  it('maps code -1 with oracle keywords to OraclePriceUnavailableError', () => {
    const err = mapRPCError(-1, 'Oracle price is stale');
    expect(err).toBeInstanceOf(OraclePriceUnavailableError);
  });

  it('maps code -1 with consensus keyword to OraclePriceUnavailableError', () => {
    const err = mapRPCError(-1, 'No consensus price available');
    expect(err).toBeInstanceOf(OraclePriceUnavailableError);
  });

  it('maps code -1 with no keywords to generic RPCError', () => {
    const err = mapRPCError(-1, 'Something else went wrong');
    expect(err).toBeInstanceOf(RPCError);
    expect(err).not.toBeInstanceOf(DigiDollarNotActiveError);
    expect(err).not.toBeInstanceOf(OraclePriceUnavailableError);
  });

  it('maps unknown code to generic RPCError', () => {
    const err = mapRPCError(-999, 'unknown');
    expect(err).toBeInstanceOf(RPCError);
    expect(err.code).toBe(-999);
  });
});
