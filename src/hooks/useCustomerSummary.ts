import { useCallback, useEffect, useState } from 'react';
import { getCustomerSummary } from '../api/analyticsApi';
import type { SummaryStatsDto } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';

const CACHE_KEY = 'analytics:vendor:customers:summary';

export function useCustomerSummary() {
  const [data, setData] = useState<SummaryStatsDto | null>(() =>
    getAnalyticsCache<SummaryStatsDto>(CACHE_KEY)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<SummaryStatsDto>(CACHE_KEY);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getCustomerSummary();
      setAnalyticsCache(CACHE_KEY, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải tổng quan khách hàng';
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
