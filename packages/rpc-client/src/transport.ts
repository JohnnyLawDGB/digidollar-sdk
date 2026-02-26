import { readFileSync } from 'node:fs';
import {
  AuthenticationError,
  ConnectionError,
  TimeoutError,
  mapRPCError,
} from './errors.js';

/** JSON-RPC 2.0 request */
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: unknown[];
}

/** JSON-RPC 2.0 response */
interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

/** Authentication modes */
export type AuthConfig =
  | { type: 'basic'; username: string; password: string }
  | { type: 'cookie'; cookiePath: string };

/** Transport configuration */
export interface TransportConfig {
  host: string;
  port: number;
  auth: AuthConfig;
  wallet?: string;
  timeout?: number;
  /** Use HTTPS instead of HTTP */
  ssl?: boolean;
}

/**
 * JSON-RPC 2.0 HTTP transport for DigiByte Core.
 *
 * Uses native `fetch` (Node 20+). Supports Basic auth and cookie file auth.
 * Wallet-specific endpoints are accessed via `/wallet/<name>` URL path.
 */
export class Transport {
  private readonly baseUrl: string;
  private readonly walletUrl: string | null;
  private readonly timeout: number;
  private authHeader: string;
  private readonly authConfig: AuthConfig;
  private nextId = 1;

  constructor(config: TransportConfig) {
    const scheme = config.ssl ? 'https' : 'http';
    this.baseUrl = `${scheme}://${config.host}:${config.port}`;
    this.walletUrl = config.wallet
      ? `${this.baseUrl}/wallet/${encodeURIComponent(config.wallet)}`
      : null;
    this.timeout = config.timeout ?? 30_000;
    this.authConfig = config.auth;
    this.authHeader = this.buildAuthHeader();
  }

  private buildAuthHeader(): string {
    if (this.authConfig.type === 'basic') {
      const { username, password } = this.authConfig;
      const encoded = Buffer.from(`${username}:${password}`).toString('base64');
      return `Basic ${encoded}`;
    }
    const cookie = readFileSync(this.authConfig.cookiePath, 'utf-8').trim();
    const encoded = Buffer.from(cookie).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Call a single RPC method.
   * @param method - RPC method name
   * @param params - Positional parameters
   * @param useWallet - If true, uses the wallet URL path
   */
  async call<T>(method: string, params: unknown[] = [], useWallet = false): Promise<T> {
    const url = useWallet && this.walletUrl ? this.walletUrl : this.baseUrl;
    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method,
      params,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new TimeoutError(this.timeout, { cause: err });
      }
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('connect'))) {
        throw new ConnectionError(
          `Failed to connect to ${url}: ${err.message}`,
          { cause: err },
        );
      }
      throw new ConnectionError(
        `Request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err instanceof Error ? err : undefined },
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError();
    }

    if (!response.ok && response.status !== 500) {
      throw new ConnectionError(
        `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const json = await response.json() as JsonRpcResponse<T>;

    if (json.error) {
      throw mapRPCError(json.error.code, json.error.message);
    }

    return json.result as T;
  }

  /**
   * Call multiple RPC methods in a single HTTP request (JSON-RPC batch).
   * Returns results in the same order as the input calls.
   */
  async batch<T extends unknown[]>(
    calls: Array<{ method: string; params?: unknown[]; useWallet?: boolean }>,
  ): Promise<T> {
    // All calls in a batch go to the same URL — use wallet if any call requires it
    const useWallet = calls.some(c => c.useWallet);
    const url = useWallet && this.walletUrl ? this.walletUrl : this.baseUrl;

    const bodies: JsonRpcRequest[] = calls.map(c => ({
      jsonrpc: '2.0' as const,
      id: this.nextId++,
      method: c.method,
      params: c.params ?? [],
    }));

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        body: JSON.stringify(bodies),
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new TimeoutError(this.timeout, { cause: err });
      }
      throw new ConnectionError(
        `Batch request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err instanceof Error ? err : undefined },
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError();
    }

    const json = await response.json() as JsonRpcResponse[];

    // Reorder by id to match input order
    const byId = new Map(json.map(r => [r.id, r]));
    const results: unknown[] = [];

    for (const body of bodies) {
      const resp = byId.get(body.id);
      if (!resp) {
        throw new ConnectionError(`Missing response for request id ${body.id}`);
      }
      if (resp.error) {
        throw mapRPCError(resp.error.code, resp.error.message);
      }
      results.push(resp.result);
    }

    return results as T;
  }

  /** Refresh cookie auth (re-reads the cookie file) */
  refreshAuth(): void {
    this.authHeader = this.buildAuthHeader();
  }
}
