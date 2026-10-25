import { useCallback, useEffect, useState } from 'react';
import { getCustomerSegments } from '../api/analyticsApi';
import type { CustomerSegmentsDto } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';

const CACHE_KEY = 'analytics:vendor:customers:segments';

export function useCustomerSegments() {
  const [data, setData] = useState<CustomerSegmentsDto | null>(() =>
    getAnalyticsCache<CustomerSegmentsDto>(CACHE_KEY)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<CustomerSegmentsDto>(CACHE_KEY);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getCustomerSegments();
      setAnalyticsCache(CACHE_KEY, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải phân khúc khách hàng';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
