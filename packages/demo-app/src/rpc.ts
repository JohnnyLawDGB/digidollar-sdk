import { env } from './env.js';

interface RPCResponse {
  result: unknown;
  error: { code: number; message: string } | null;
  id: string;
}

export class RPCError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    this.name = 'RPCError';
  }
}

export async function rpc(method: string, params: unknown[] = []): Promise<any> {
  const wallet = env.rpcWallet ? `/wallet/${env.rpcWallet}` : '';
  const url = `http://${env.rpcHost}:${env.rpcPort}${wallet}`;
  const auth = Buffer.from(`${env.rpcUser}:${env.rpcPass}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'demo',
      method,
      params,
    }),
  });

  if (!res.ok && res.status === 401) {
    throw new RPCError('RPC authentication failed', -1);
  }

  const body = await res.json() as RPCResponse;
  if (body.error) {
    throw new RPCError(body.error.message, body.error.code);
  }
  return body.result;
}
