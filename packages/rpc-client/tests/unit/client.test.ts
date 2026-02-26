import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DigiDollarRPC } from '../../src/client.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function rpcOk(result: unknown): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id: 1, result }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('DigiDollarRPC', () => {
  let dd: DigiDollarRPC;

  beforeEach(() => {
    mockFetch.mockReset();
    dd = new DigiDollarRPC({
      port: 14024,
      username: 'user',
      password: 'pass',
      wallet: 'dd_wallet',
    });
  });

  it('has all oracle methods', () => {
    expect(typeof dd.getOraclePrice).toBe('function');
    expect(typeof dd.getAllOraclePrices).toBe('function');
    expect(typeof dd.getOracles).toBe('function');
    expect(typeof dd.listOracle).toBe('function');
    expect(typeof dd.stopOracle).toBe('function');
    expect(typeof dd.getOraclePubkey).toBe('function');
    expect(typeof dd.sendOraclePrice).toBe('function');
    expect(typeof dd.submitOraclePrice).toBe('function');
    expect(typeof dd.startOracle).toBe('function');
    expect(typeof dd.createOracleKey).toBe('function');
    expect(typeof dd.setMockOraclePrice).toBe('function');
    expect(typeof dd.getMockOraclePrice).toBe('function');
    expect(typeof dd.enableMockOracle).toBe('function');
    expect(typeof dd.simulatePriceVolatility).toBe('function');
  });

  it('has all balance methods', () => {
    expect(typeof dd.getBalance).toBe('function');
  });

  it('has all transaction methods', () => {
    expect(typeof dd.mint).toBe('function');
    expect(typeof dd.send).toBe('function');
    expect(typeof dd.redeem).toBe('function');
    expect(typeof dd.listTransactions).toBe('function');
  });

  it('has all position methods', () => {
    expect(typeof dd.listPositions).toBe('function');
    expect(typeof dd.getRedemptionInfo).toBe('function');
    expect(typeof dd.calculateCollateral).toBe('function');
    expect(typeof dd.estimateCollateral).toBe('function');
  });

  it('has all wallet methods', () => {
    expect(typeof dd.getAddress).toBe('function');
    expect(typeof dd.validateAddress).toBe('function');
    expect(typeof dd.listAddresses).toBe('function');
    expect(typeof dd.importAddress).toBe('function');
  });

  it('has all system methods', () => {
    expect(typeof dd.getStats).toBe('function');
    expect(typeof dd.getDcaMultiplier).toBe('function');
    expect(typeof dd.getDeploymentInfo).toBe('function');
    expect(typeof dd.getProtectionStatus).toBe('function');
  });

  it('has raw call escape hatch', () => {
    expect(typeof dd.call).toBe('function');
  });

  describe('parameter serialization', () => {
    it('getOraclePrice sends no params', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ price_micro_usd: 4200 }));
      await dd.getOraclePrice();
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('getoracleprice');
      expect(body.params).toEqual([]);
    });

    it('getAllOraclePrices sends optional blocks param', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ oracles: [] }));
      await dd.getAllOraclePrices(50);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('getalloracleprices');
      expect(body.params).toEqual([50]);
    });

    it('mint serializes params correctly', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ txid: 'abc' }));
      await dd.mint({ ddAmountCents: 10000, lockTier: 5 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('mintdigidollar');
      expect(body.params).toEqual([10000, 5]);
    });

    it('mint with feeRate includes it', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ txid: 'abc' }));
      await dd.mint({ ddAmountCents: 10000, lockTier: 5, feeRate: 200000 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.params).toEqual([10000, 5, 200000]);
    });

    it('send serializes params correctly', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ txid: 'abc' }));
      await dd.send({ address: 'TDtest123', amountCents: 5000 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('senddigidollar');
      expect(body.params).toEqual(['TDtest123', 5000]);
    });

    it('send with comment and feeRate', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ txid: 'abc' }));
      await dd.send({
        address: 'TDtest123',
        amountCents: 5000,
        comment: 'test payment',
        feeRate: 100000,
      });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.params).toEqual(['TDtest123', 5000, 'test payment', 100000]);
    });

    it('redeem serializes params correctly', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ txid: 'abc' }));
      await dd.redeem({ positionId: 'aabb', ddAmountCents: 10000 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('redeemdigidollar');
      expect(body.params).toEqual(['aabb', 10000]);
    });

    it('listPositions with no params', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk([]));
      await dd.listPositions();
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('listdigidollarpositions');
      expect(body.params).toEqual([]);
    });

    it('listPositions with filters', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk([]));
      await dd.listPositions({ activeOnly: false, tierFilter: 3 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.params).toEqual([false, 3]);
    });

    it('getBalance with no params uses wallet endpoint', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ total: '0' }));
      await dd.getBalance();
      const [url] = mockFetch.mock.calls[0]!;
      expect(url).toContain('/wallet/dd_wallet');
    });

    it('getBalance with address', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ total: '100' }));
      await dd.getBalance({ address: 'TDtest' });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.params).toEqual(['TDtest']);
    });

    it('calculateCollateral serializes correctly', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ required_dgb: 1000 }));
      await dd.calculateCollateral({ ddAmountCents: 10000, lockDays: 365 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('calculatecollateralrequirement');
      expect(body.params).toEqual([10000, 365]);
    });

    it('estimateCollateral serializes correctly', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ required_dgb: '500.00' }));
      await dd.estimateCollateral({ ddAmount: 10000, lockTier: 5 });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('estimatecollateral');
      expect(body.params).toEqual([10000, 5]);
    });

    it('validateAddress sends address param', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ isvalid: true }));
      await dd.validateAddress('TDtest123');
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('validateddaddress');
      expect(body.params).toEqual(['TDtest123']);
    });

    it('getAddress with label', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk('TDnewaddr'));
      await dd.getAddress('my-label');
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('getdigidollaraddress');
      expect(body.params).toEqual(['my-label']);
    });

    it('getStats sends no params', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ health_percentage: 683 }));
      await dd.getStats();
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('getdigidollarstats');
      expect(body.params).toEqual([]);
    });

    it('getDcaMultiplier with optional health', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ multiplier: 1.25 }));
      await dd.getDcaMultiplier(120);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('getdcamultiplier');
      expect(body.params).toEqual([120]);
    });

    it('listTransactions with filters', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk([]));
      await dd.listTransactions({ count: 20, category: 'mint' });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('listdigidollartxs');
      expect(body.params).toEqual([20, 0, '', 'mint']);
    });

    it('importAddress with all options', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ success: true }));
      await dd.importAddress({
        address: 'TDtest',
        label: 'watch',
        rescan: true,
        p2sh: false,
      });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('importdigidollaraddress');
      expect(body.params).toEqual(['TDtest', 'watch', true, false]);
    });

    it('stopOracle sends oracle_id', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ success: true }));
      await dd.stopOracle(8);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('stoporacle');
      expect(body.params).toEqual([8]);
    });

    it('submitOraclePrice sends id and price', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ accepted: true }));
      await dd.submitOraclePrice(3, 4500);
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('submitoracleprice');
      expect(body.params).toEqual([3, 4500]);
    });

    it('raw call() passes through', async () => {
      mockFetch.mockResolvedValueOnce(rpcOk({ custom: true }));
      const result = await dd.call<{ custom: boolean }>('somefuturemethod', [1, 'two']);
      expect(result).toEqual({ custom: true });
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.method).toBe('somefuturemethod');
      expect(body.params).toEqual([1, 'two']);
    });
  });
});
