import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Transport } from '../../src/transport.js';
import {
  AuthenticationError,
  ConnectionError,
  RPCError,
  InvalidParameterError,
} from '../../src/errors.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock fs.readFileSync for cookie auth tests
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => '__cookie__:abc123'),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Transport', () => {
  let transport: Transport;

  beforeEach(() => {
    mockFetch.mockReset();
    transport = new Transport({
      host: '127.0.0.1',
      port: 14024,
      auth: { type: 'basic', username: 'user', password: 'pass' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('call()', () => {
    it('sends correct JSON-RPC request', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: { price: 42 } }),
      );

      await transport.call('getoracleprice');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0]!;
      expect(url).toBe('http://127.0.0.1:14024');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(opts.body);
      expect(body.jsonrpc).toBe('2.0');
      expect(body.method).toBe('getoracleprice');
      expect(body.params).toEqual([]);
      expect(typeof body.id).toBe('number');
    });

    it('sends Basic auth header', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: null }),
      );

      await transport.call('test');

      const [, opts] = mockFetch.mock.calls[0]!;
      const expected = 'Basic ' + Buffer.from('user:pass').toString('base64');
      expect(opts.headers['Authorization']).toBe(expected);
    });

    it('sends params as positional array', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: {} }),
      );

      await transport.call('mintdigidollar', [10000, 5]);

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(body.params).toEqual([10000, 5]);
    });

    it('returns result on success', async () => {
      const expectedResult = { price_micro_usd: 4200 };
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: expectedResult }),
      );

      const result = await transport.call('getoracleprice');
      expect(result).toEqual(expectedResult);
    });

    it('uses wallet URL path when useWallet=true', async () => {
      const walletTransport = new Transport({
        host: '127.0.0.1',
        port: 14024,
        auth: { type: 'basic', username: 'user', password: 'pass' },
        wallet: 'dd_wallet',
      });

      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: {} }),
      );

      await walletTransport.call('getdigidollarbalance', [], true);

      const [url] = mockFetch.mock.calls[0]!;
      expect(url).toBe('http://127.0.0.1:14024/wallet/dd_wallet');
    });

    it('uses base URL when useWallet=true but no wallet configured', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: {} }),
      );

      await transport.call('getdigidollarbalance', [], true);

      const [url] = mockFetch.mock.calls[0]!;
      expect(url).toBe('http://127.0.0.1:14024');
    });

    it('throws AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      );

      await expect(transport.call('test')).rejects.toThrow(AuthenticationError);
    });

    it('throws AuthenticationError on 403', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Forbidden', { status: 403 }),
      );

      await expect(transport.call('test')).rejects.toThrow(AuthenticationError);
    });

    it('throws ConnectionError on non-500 HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Bad Gateway', { status: 502 }),
      );

      await expect(transport.call('test')).rejects.toThrow(ConnectionError);
    });

    it('maps RPC error to typed error', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -8, message: 'Invalid lock tier' },
        }, 500),
      );

      await expect(transport.call('mintdigidollar', [100, 99])).rejects.toThrow(
        InvalidParameterError,
      );
    });

    it('throws generic RPCError for unknown code', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -999, message: 'mysterious' },
        }, 500),
      );

      await expect(transport.call('test')).rejects.toThrow(RPCError);
    });

    it('throws ConnectionError on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(transport.call('test')).rejects.toThrow(ConnectionError);
    });

    it('uses HTTPS when ssl=true', async () => {
      const sslTransport = new Transport({
        host: '127.0.0.1',
        port: 14024,
        auth: { type: 'basic', username: 'u', password: 'p' },
        ssl: true,
      });

      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: null }),
      );

      await sslTransport.call('test');
      expect(mockFetch.mock.calls[0]![0]).toMatch(/^https:/);
    });

    it('increments request IDs', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 1, result: null }))
        .mockResolvedValueOnce(jsonResponse({ jsonrpc: '2.0', id: 2, result: null }));

      await transport.call('a');
      await transport.call('b');

      const id1 = JSON.parse(mockFetch.mock.calls[0]![1].body).id;
      const id2 = JSON.parse(mockFetch.mock.calls[1]![1].body).id;
      expect(id2).toBe(id1 + 1);
    });
  });

  describe('cookie auth', () => {
    it('reads cookie file for auth', async () => {
      const cookieTransport = new Transport({
        host: '127.0.0.1',
        port: 14024,
        auth: { type: 'cookie', cookiePath: '/tmp/.cookie' },
      });

      mockFetch.mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: null }),
      );

      await cookieTransport.call('test');

      const [, opts] = mockFetch.mock.calls[0]!;
      const expected = 'Basic ' + Buffer.from('__cookie__:abc123').toString('base64');
      expect(opts.headers['Authorization']).toBe(expected);
    });
  });

  describe('batch()', () => {
    it('sends array of requests and returns ordered results', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse([
          { jsonrpc: '2.0', id: 2, result: 'second' },
          { jsonrpc: '2.0', id: 1, result: 'first' },
        ]),
      );

      const results = await transport.batch([
        { method: 'a' },
        { method: 'b', params: [1] },
      ]);

      expect(results).toEqual(['first', 'second']);

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });

    it('throws on batch error', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse([
          { jsonrpc: '2.0', id: 1, result: 'ok' },
          { jsonrpc: '2.0', id: 2, error: { code: -8, message: 'bad' } },
        ]),
      );

      await expect(
        transport.batch([{ method: 'a' }, { method: 'b' }]),
      ).rejects.toThrow(InvalidParameterError);
    });
  });
});
