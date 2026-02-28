import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { CollateralEstimate } from '../api/types';

export function useEstimate(amountCents: number, tier: number, debounceMs = 500) {
  const [estimate, setEstimate] = useState<CollateralEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!amountCents || amountCents <= 0) {
      setEstimate(null);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get<CollateralEstimate>(
          `/estimate-collateral?amount=${amountCents}&tier=${tier}`
        );
        setEstimate(res);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setEstimate(null);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [amountCents, tier, debounceMs]);

  return { estimate, loading, error };
}
