import { useCallback, useEffect, useState } from 'react';
import { getVendorDashboard } from '../api/analyticsApi';
import type { AnalyticsPeriodQuery, VendorDashboardResponse } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';
import { todayAnchor } from '../utils/orderStatsPeriod';

function cacheKey(query: AnalyticsPeriodQuery): string {
  const period = query.period ?? 'MONTH';
  const anchor = period === 'ALL' ? 'all' : query.anchor || todayAnchor();
  return `analytics:vendor:dashboard:${period}:${anchor}`;
}

export function useVendorDashboard(query: AnalyticsPeriodQuery = {}) {
  const key = cacheKey(query);
  const [data, setData] = useState<VendorDashboardResponse | null>(() =>
    getAnalyticsCache<VendorDashboardResponse>(key)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force) {
      const cached = getAnalyticsCache<VendorDashboardResponse>(key);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return cached;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getVendorDashboard(query);
      setAnalyticsCache(key, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải dashboard analytics';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, query.period, query.anchor]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
