import { useState, useCallback } from 'react';
import { api, ApiError } from '../api/client';
import { useToast } from '../components/ToastProvider';

export function useMutation<TBody, TResult>(url: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const mutate = useCallback(
    async (body: TBody): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await api.post<TResult>(url, body);
        setResult(res);
        toast('Transaction submitted successfully!', 'success');
        return res;
      } catch (err: any) {
        const msg = err instanceof ApiError ? err.message : 'Request failed';
        setError(msg);
        toast(msg, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, toast]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { mutate, loading, result, error, reset };
}
