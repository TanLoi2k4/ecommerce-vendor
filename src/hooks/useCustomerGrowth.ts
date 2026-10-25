import { useCallback, useEffect, useState } from 'react';
import { getCustomerGrowth } from '../api/analyticsApi';
import type { AnalyticsPeriodQuery, CustomerGrowthResponse } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';
import { todayAnchor } from '../utils/orderStatsPeriod';

function cacheKey(query: AnalyticsPeriodQuery): string {
  const period = query.period ?? 'MONTH';
  const anchor = period === 'ALL' ? 'all' : query.anchor || todayAnchor();
  return `analytics:vendor:customers:growth:${period}:${anchor}`;
}

export function useCustomerGrowth(query: AnalyticsPeriodQuery = {}) {
  const key = cacheKey(query);
  const [data, setData] = useState<CustomerGrowthResponse | null>(() =>
    getAnalyticsCache<CustomerGrowthResponse>(key)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<CustomerGrowthResponse>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getCustomerGrowth(query);
      setAnalyticsCache(key, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải biểu đồ tăng trưởng khách hàng';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, query.period, query.anchor]);

  useEffect(() => {
    setData(getAnalyticsCache<CustomerGrowthResponse>(key));
    refresh();
  }, [key, refresh]);

  return { data, isLoading, error, refresh };
}
