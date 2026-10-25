import { useCallback, useEffect, useState } from 'react';
import { getProductsByCategory } from '../api/analyticsApi';
import type { AnalyticsPeriodQuery, CategoryBreakdownDto } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';
import { todayAnchor } from '../utils/orderStatsPeriod';

function cacheKey(query: AnalyticsPeriodQuery): string {
  const period = query.period ?? 'MONTH';
  const anchor = period === 'ALL' ? 'all' : query.anchor || todayAnchor();
  return `analytics:vendor:products:by-category:${period}:${anchor}`;
}

export function useProductsByCategory(query: AnalyticsPeriodQuery = {}) {
  const key = cacheKey(query);
  const [data, setData] = useState<CategoryBreakdownDto[] | null>(() =>
    getAnalyticsCache<CategoryBreakdownDto[]>(key)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<CategoryBreakdownDto[]>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getProductsByCategory(query);
      setAnalyticsCache(key, result);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu danh mục';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, query.period, query.anchor]);

  useEffect(() => {
    setData(getAnalyticsCache<CategoryBreakdownDto[]>(key));
    refresh();
  }, [key, refresh]);

  return { data: data ?? [], isLoading, error, refresh };
}
