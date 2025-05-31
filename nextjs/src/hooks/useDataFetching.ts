import { useState, useCallback } from 'react';

interface UseDataFetchingOptions<T> {
  initialData?: T;
  onError?: (error: Error) => void;
  retryDelay?: number;
}

interface UseDataFetchingReturn<T> {
  data: T;
  loading: boolean;
  error: string | null;
  retryAttempt: number;
  fetch: (isRetry?: boolean) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export function useDataFetching<T>(
  fetchFunction: () => Promise<T>,
  initialData: T,
  options: UseDataFetchingOptions<T> = {}
): UseDataFetchingReturn<T> {
  const { onError, retryDelay = 500 } = options;
  
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const fetch = useCallback(async (isRetry: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isRetry) {
        setRetryAttempt(prev => prev + 1);
        // Add a small delay for better UX on retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, onError, retryDelay]);

  const retry = useCallback(() => {
    return fetch(true);
  }, [fetch]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(true);
    setError(null);
    setRetryAttempt(0);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    retryAttempt,
    fetch,
    retry,
    reset
  };
} 