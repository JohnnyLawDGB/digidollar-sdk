import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import type { PositionsResponse, EnrichedPosition } from '../api/types';

export function usePositions(intervalMs = 30_000) {
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await api.get<PositionsResponse>('/positions');
      setPositions(res.positions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await api.get<PositionsResponse>('/positions');
        if (!cancelled) {
          setPositions(res.positions);
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

  return { positions, error, loading, refetch };
}
