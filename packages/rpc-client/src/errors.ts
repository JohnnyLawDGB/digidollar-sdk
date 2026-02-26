/** Base error for all DigiDollar SDK errors */
export class DigiDollarError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DigiDollarError';
  }
}

/** Failed to connect to the DigiByte node */
export class ConnectionError extends DigiDollarError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConnectionError';
  }
}

/** Request timed out */
export class TimeoutError extends ConnectionError {
  constructor(timeoutMs: number, options?: ErrorOptions) {
    super(`Request timed out after ${timeoutMs}ms`, options);
    this.name = 'TimeoutError';
  }
}

/** HTTP 401/403 — bad credentials */
export class AuthenticationError extends ConnectionError {
  constructor(options?: ErrorOptions) {
    super('Authentication failed: check RPC username/password', options);
    this.name = 'AuthenticationError';
  }
}

/** Node returned a JSON-RPC error response */
export class RPCError extends DigiDollarError {
  readonly code: number;
  readonly rpcMessage: string;

  constructor(code: number, message: string) {
    super(`RPC error ${code}: ${message}`);
    this.name = 'RPCError';
    this.code = code;
    this.rpcMessage = message;
  }
}

/** DigiDollar protocol not yet activated on chain (code -1 with activation message) */
export class DigiDollarNotActiveError extends RPCError {
  constructor(message: string) {
    super(-1, message);
    this.name = 'DigiDollarNotActiveError';
  }
}

/** Invalid parameter (code -8) */
export class InvalidParameterError extends RPCError {
  constructor(message: string) {
    super(-8, message);
    this.name = 'InvalidParameterError';
  }
}

/** Invalid address or key (code -5) */
export class InvalidAddressError extends RPCError {
  constructor(message: string) {
    super(-5, message);
    this.name = 'InvalidAddressError';
  }
}

/** Insufficient funds (code -6) */
export class InsufficientFundsError extends RPCError {
  constructor(message: string) {
    super(-6, message);
    this.name = 'InsufficientFundsError';
  }
}

/** Wallet is locked, needs passphrase (code -13) */
export class WalletLockedError extends RPCError {
  constructor(message: string) {
    super(-13, message);
    this.name = 'WalletLockedError';
  }
}

/** Wallet not found (code -18) */
export class WalletNotFoundError extends RPCError {
  constructor(message: string) {
    super(-18, message);
    this.name = 'WalletNotFoundError';
  }
}

/** Oracle price unavailable (code -1, oracle-specific) */
export class OraclePriceUnavailableError extends RPCError {
  constructor(message: string) {
    super(-1, message);
    this.name = 'OraclePriceUnavailableError';
  }
}

/** Wallet error — DD wallet not initialized, build/sign failures (code -4) */
export class WalletError extends RPCError {
  constructor(message: string) {
    super(-4, message);
    this.name = 'WalletError';
  }
}

/** Method not available on this network (code -32601) */
export class MethodNotAvailableError extends RPCError {
  constructor(message: string) {
    super(-32601, message);
    this.name = 'MethodNotAvailableError';
  }
}

const ORACLE_KEYWORDS = ['oracle', 'price', 'stale', 'consensus'];
const ACTIVATION_KEYWORDS = ['not active', 'not activated', 'deployment', 'not enabled'];

/**
 * Maps a JSON-RPC error code + message to a typed error.
 * Tries specific codes first, then falls back to keyword matching for code -1.
 */
export function mapRPCError(code: number, message: string): RPCError {
  switch (code) {
    case -4:
      return new WalletError(message);
    case -5:
      return new InvalidAddressError(message);
    case -6:
      return new InsufficientFundsError(message);
    case -8:
      return new InvalidParameterError(message);
    case -13:
      return new WalletLockedError(message);
    case -18:
      return new WalletNotFoundError(message);
    case -32601:
      return new MethodNotAvailableError(message);
    case -1: {
      const lower = message.toLowerCase();
      if (ACTIVATION_KEYWORDS.some(kw => lower.includes(kw))) {
        return new DigiDollarNotActiveError(message);
      }
      if (ORACLE_KEYWORDS.some(kw => lower.includes(kw))) {
        return new OraclePriceUnavailableError(message);
      }
      return new RPCError(code, message);
    }
    default:
      return new RPCError(code, message);
  }
}
