import { useCallback, useEffect, useState } from 'react';
import { getRevenueReport } from '../api/analyticsApi';
import type { RevenueReportResponse } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';

function cacheKey(from: string, to: string): string {
  return `analytics:vendor:revenue-report:${from}:${to}`;
}

export function useRevenueReport(from: string, to: string) {
  const key = cacheKey(from, to);
  const [data, setData] = useState<RevenueReportResponse | null>(() =>
    getAnalyticsCache<RevenueReportResponse>(key)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<RevenueReportResponse>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getRevenueReport(from, to);
      setAnalyticsCache(key, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải báo cáo doanh thu';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [from, key, to]);

  useEffect(() => {
    setData(getAnalyticsCache<RevenueReportResponse>(key));
    refresh();
  }, [key, refresh]);

  return { data, isLoading, error, refresh };
}
