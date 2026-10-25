import { useCallback, useEffect, useState } from 'react';
import { getTopCustomers } from '../api/analyticsApi';
import type { TopCustomerDto } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';

function cacheKey(limit: number): string {
  return `analytics:vendor:customers:top:${limit}`;
}

export function useTopCustomers(limit = 5) {
  const key = cacheKey(limit);
  const [data, setData] = useState<TopCustomerDto[] | null>(() =>
    getAnalyticsCache<TopCustomerDto[]>(key)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<TopCustomerDto[]>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getTopCustomers(limit);
      setAnalyticsCache(key, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải top khách hàng';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: data ?? [], isLoading, error, refresh };
}
