/** Base error for all @digidollar/core errors */
export class CoreError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'CoreError';
  }
}

/** No signer was provided but a signing operation was attempted */
export class NoSignerError extends CoreError {
  constructor() {
    super('No signer configured — provide a Signer to perform transactions');
    this.name = 'NoSignerError';
  }
}

/** Oracle price is stale or unavailable */
export class StalePriceError extends CoreError {
  readonly priceAgeSecs: number;

  constructor(priceAgeSecs: number) {
    super(`Oracle price is stale (age: ${priceAgeSecs}s)`);
    this.name = 'StalePriceError';
    this.priceAgeSecs = priceAgeSecs;
  }
}

/** Insufficient standard UTXOs for fees */
export class InsufficientFundsError extends CoreError {
  readonly required: bigint;
  readonly available: bigint;

  constructor(required: bigint, available: bigint) {
    super(`Insufficient funds: need ${required} sats, have ${available} sats`);
    this.name = 'InsufficientFundsError';
    this.required = required;
    this.available = available;
  }
}

/** Insufficient DD token UTXOs for a transfer or redeem */
export class InsufficientDDError extends CoreError {
  readonly required: bigint;
  readonly available: bigint;

  constructor(required: bigint, available: bigint) {
    super(`Insufficient DD: need ${required} cents, have ${available} cents`);
    this.name = 'InsufficientDDError';
    this.required = required;
    this.available = available;
  }
}

/** Position not found or not redeemable */
export class PositionError extends CoreError {
  constructor(message: string) {
    super(message);
    this.name = 'PositionError';
  }
}

/** Invalid address encoding */
export class AddressError extends CoreError {
  constructor(message: string) {
    super(message);
    this.name = 'AddressError';
  }
}

/** Backend communication failure */
export class BackendError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BackendError';
  }
}
