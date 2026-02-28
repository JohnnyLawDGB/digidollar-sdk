/** Format DD cents as dollars (e.g. 10000 → "100.00") */
export function formatDD(cents: bigint | number | string): string {
  const c = typeof cents === 'string' ? parseInt(cents, 10) : Number(cents);
  return (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format satoshis as DGB (e.g. 100000000n → "1.00000000") */
export function formatDGB(sats: bigint | number | string): string {
  const s = typeof sats === 'string' ? parseFloat(sats) : Number(sats);
  return (s / 1e8).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

/** Format micro-USD oracle price as dollars (e.g. 4200n → "$0.004200") */
export function formatOraclePrice(microUsd: bigint | number): string {
  const price = Number(microUsd) / 1_000_000;
  return `$${price.toFixed(6)}`;
}

/** Format block count with commas */
export function formatBlocks(n: number): string {
  return n.toLocaleString('en-US');
}

/** Truncate an address for display */
export function truncateAddress(addr: string, chars = 8): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}
