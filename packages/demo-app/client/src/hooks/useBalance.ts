import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { BalanceResponse } from '../api/types';

export function useBalance(intervalMs = 15_000) {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await api.get<BalanceResponse>('/balance');
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [intervalMs]);

  return { data, error, loading };
}
