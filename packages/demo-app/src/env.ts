function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  mnemonic: required('DD_MNEMONIC'),
  rpcHost: optional('DD_RPC_HOST', '127.0.0.1'),
  rpcPort: parseInt(optional('DD_RPC_PORT', '14024'), 10),
  rpcUser: optional('DD_RPC_USER', ''),
  rpcPass: optional('DD_RPC_PASS', ''),
  rpcWallet: process.env['DD_RPC_WALLET'] || undefined,
  port: parseInt(optional('PORT', '3100'), 10),
};
