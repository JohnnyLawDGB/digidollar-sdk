export class TxBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TxBuilderError';
  }
}

export class InsufficientCollateralError extends TxBuilderError {
  constructor(
    public readonly required: bigint,
    public readonly available: bigint,
  ) {
    super(`Insufficient collateral: need ${required} sats, have ${available} sats`);
    this.name = 'InsufficientCollateralError';
  }
}

export class InsufficientFeeError extends TxBuilderError {
  constructor(
    public readonly required: bigint,
    public readonly available: bigint,
  ) {
    super(`Insufficient fee funds: need ${required} sats, have ${available} sats`);
    this.name = 'InsufficientFeeError';
  }
}

export class InsufficientDDError extends TxBuilderError {
  constructor(
    public readonly required: bigint,
    public readonly available: bigint,
  ) {
    super(`Insufficient DD: need ${required} cents, have ${available} cents`);
    this.name = 'InsufficientDDError';
  }
}

export class InvalidParamsError extends TxBuilderError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParamsError';
  }
}

export class CoinSelectionError extends TxBuilderError {
  constructor(message: string) {
    super(message);
    this.name = 'CoinSelectionError';
  }
}
