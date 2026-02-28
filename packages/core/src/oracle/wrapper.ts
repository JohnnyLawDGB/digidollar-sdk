/**
 * Oracle Wrapper — oracle price access with staleness checks and unit conversions.
 */

import type { OraclePrice } from '@digidollar/rpc-client';
import type { Backend } from '../backend/interface.js';
import { StalePriceError } from '../errors.js';
import { COIN } from '@digidollar/tx-builder';

/** Snapshot of oracle price data with computed fields */
export interface OracleSnapshot {
  /** Price in micro-USD (1,000,000 = $1.00 per DGB) */
  priceMicroUsd: bigint;
  /** Whether the price is stale */
  isStale: boolean;
  /** Age of the price in seconds */
  priceAgeSecs: number;
  /** Number of oracles reporting */
  oracleCount: number;
  /** Price status */
  status: string;
  /** Raw oracle price data */
  raw: OraclePrice;
}

export class OracleWrapper {
  constructor(private readonly backend: Backend) {}

  /** Get current oracle price snapshot */
  async getPrice(): Promise<OracleSnapshot> {
    const raw = await this.backend.getOraclePrice();
    const now = Math.floor(Date.now() / 1000);
    const priceAgeSecs = raw.last_update_time > 0 ? now - raw.last_update_time : 0;

    return {
      priceMicroUsd: BigInt(raw.price_micro_usd),
      isStale: raw.is_stale,
      priceAgeSecs,
      oracleCount: raw.oracle_count,
      status: raw.status,
      raw,
    };
  }

  /** Get price or throw if stale — use before minting */
  async requireFreshPrice(): Promise<OracleSnapshot> {
    const snapshot = await this.getPrice();
    if (snapshot.isStale) {
      throw new StalePriceError(snapshot.priceAgeSecs);
    }
    if (snapshot.priceMicroUsd === 0n) {
      throw new StalePriceError(snapshot.priceAgeSecs);
    }
    return snapshot;
  }

  /**
   * Convert DD cents to satoshis at the given oracle price.
   * ddCents * COIN / priceMicroUsd * 1_000_000 / 100
   * = ddCents * COIN * 10_000 / priceMicroUsd
   */
  ddToSats(ddCents: bigint, priceMicroUsd: bigint): bigint {
    if (priceMicroUsd === 0n) throw new Error('Oracle price is zero');
    return (ddCents * COIN * 10_000n) / priceMicroUsd;
  }

  /**
   * Convert satoshis to DD cents at the given oracle price.
   * sats * priceMicroUsd / (COIN * 10_000)
   */
  satsToDDCents(sats: bigint, priceMicroUsd: bigint): bigint {
    return (sats * priceMicroUsd) / (COIN * 10_000n);
  }
}
