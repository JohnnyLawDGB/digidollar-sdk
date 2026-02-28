import { DigiDollar, BIP86Signer } from '@digidollar/core';
import { env } from './env.js';

const signer = BIP86Signer.fromMnemonic(env.mnemonic, 'testnet');

export const dd = new DigiDollar({
  network: 'testnet',
  rpc: {
    host: env.rpcHost,
    port: env.rpcPort,
    username: env.rpcUser,
    password: env.rpcPass,
    wallet: env.rpcWallet,
  },
  signer,
});

// Serialize write operations to prevent UTXO double-spend
let writeLock: Promise<void> = Promise.resolve();

export async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeLock;
  let resolve: () => void;
  writeLock = new Promise<void>((r) => { resolve = r; });
  try {
    await prev;
    return await fn();
  } finally {
    resolve!();
  }
}
