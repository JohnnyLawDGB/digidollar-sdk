import type { Transport } from '../transport.js';
import type {
  OraclePrice,
  AllOraclePrices,
  OracleInfo,
  LocalOracleInfo,
  OraclePubkey,
  SendOraclePriceResult,
  SubmitOraclePriceResult,
  StopOracleResult,
  StartOracleResult,
  CreateOracleKeyResult,
  MockOraclePriceResult,
  GetMockOraclePriceResult,
  SimulatePriceVolatilityResult,
  EnableMockOracleResult,
} from '../types/oracle.js';

export interface OracleMethods {
  /** Get current consensus oracle price for DGB/USD */
  getOraclePrice(): Promise<OraclePrice>;

  /** Get all oracle prices for recent blocks */
  getAllOraclePrices(blocks?: number): Promise<AllOraclePrices>;

  /** Get info about all registered oracles */
  getOracles(activeOnly?: boolean): Promise<OracleInfo[]>;

  /** Get info about the locally running oracle (if any) */
  listOracle(): Promise<LocalOracleInfo>;

  /** Stop a running oracle */
  stopOracle(oracleId: number): Promise<StopOracleResult>;

  /** Get the public key for an oracle */
  getOraclePubkey(oracleId: number): Promise<OraclePubkey>;

  /** Send an oracle price (testnet/regtest only) */
  sendOraclePrice(priceUsd: number, oracleId?: number): Promise<SendOraclePriceResult>;

  /** Submit an oracle price directly (regtest only) */
  submitOraclePrice(oracleId: number, priceMicroUsd: number): Promise<SubmitOraclePriceResult>;

  /** Start an oracle node (wallet context) */
  startOracle(oracleId: number, privateKey?: string): Promise<StartOracleResult>;

  /** Generate an oracle key pair (wallet context) */
  createOracleKey(oracleId: number): Promise<CreateOracleKeyResult>;

  /** Set mock oracle price (regtest only) */
  setMockOraclePrice(priceMicroUsd: number): Promise<MockOraclePriceResult>;

  /** Get current mock oracle price (regtest only) */
  getMockOraclePrice(): Promise<GetMockOraclePriceResult>;

  /** Enable or disable mock oracle (regtest only) */
  enableMockOracle(enable: boolean): Promise<EnableMockOracleResult>;

  /** Simulate price volatility (regtest only) */
  simulatePriceVolatility(percentChange: number): Promise<SimulatePriceVolatilityResult>;
}

export function createOracleMethods(transport: Transport): OracleMethods {
  return {
    getOraclePrice() {
      return transport.call<OraclePrice>('getoracleprice');
    },

    getAllOraclePrices(blocks?: number) {
      const params: unknown[] = [];
      if (blocks !== undefined) params.push(blocks);
      return transport.call<AllOraclePrices>('getalloracleprices', params);
    },

    getOracles(activeOnly?: boolean) {
      const params: unknown[] = [];
      if (activeOnly !== undefined) params.push(activeOnly);
      return transport.call<OracleInfo[]>('getoracles', params);
    },

    listOracle() {
      return transport.call<LocalOracleInfo>('listoracle');
    },

    stopOracle(oracleId: number) {
      return transport.call<StopOracleResult>('stoporacle', [oracleId]);
    },

    getOraclePubkey(oracleId: number) {
      return transport.call<OraclePubkey>('getoraclepubkey', [oracleId]);
    },

    sendOraclePrice(priceUsd: number, oracleId?: number) {
      const params: unknown[] = [priceUsd];
      if (oracleId !== undefined) params.push(oracleId);
      return transport.call<SendOraclePriceResult>('sendoracleprice', params);
    },

    submitOraclePrice(oracleId: number, priceMicroUsd: number) {
      return transport.call<SubmitOraclePriceResult>('submitoracleprice', [oracleId, priceMicroUsd]);
    },

    startOracle(oracleId: number, privateKey?: string) {
      const params: unknown[] = [oracleId];
      if (privateKey !== undefined) params.push(privateKey);
      return transport.call<StartOracleResult>('startoracle', params, true);
    },

    createOracleKey(oracleId: number) {
      return transport.call<CreateOracleKeyResult>('createoraclekey', [oracleId], true);
    },

    setMockOraclePrice(priceMicroUsd: number) {
      return transport.call<MockOraclePriceResult>('setmockoracleprice', [priceMicroUsd]);
    },

    getMockOraclePrice() {
      return transport.call<GetMockOraclePriceResult>('getmockoracleprice');
    },

    enableMockOracle(enable: boolean) {
      return transport.call<EnableMockOracleResult>('enablemockoracle', [enable]);
    },

    simulatePriceVolatility(percentChange: number) {
      return transport.call<SimulatePriceVolatilityResult>('simulatepricevolatility', [percentChange]);
    },
  };
}
