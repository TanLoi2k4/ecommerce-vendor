import { useCallback, useEffect, useState } from 'react';
import { getTopProducts } from '../api/analyticsApi';
import type { AnalyticsPeriodQuery, TopProductDto } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';
import { todayAnchor } from '../utils/orderStatsPeriod';

function cacheKey(limit: number, enrich: boolean, query: AnalyticsPeriodQuery): string {
  const period = query.period ?? 'MONTH';
  const anchor = period === 'ALL' ? 'all' : query.anchor || todayAnchor();
  return `analytics:vendor:products:top:${period}:${anchor}:${limit}:${enrich}`;
}

export function useTopProducts(limit = 5, enrich = true, query: AnalyticsPeriodQuery = {}) {
  const key = cacheKey(limit, enrich, query);
  const [data, setData] = useState<TopProductDto[] | null>(() =>
    getAnalyticsCache<TopProductDto[]>(key)
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cached = getAnalyticsCache<TopProductDto[]>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const products = await getTopProducts(limit, enrich, query);
      setAnalyticsCache(key, products);
      setData(products);
      return products;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải top sản phẩm';
      setError(message);
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enrich, key, limit, query.period, query.anchor]);

  useEffect(() => {
    setData(getAnalyticsCache<TopProductDto[]>(key));
    refresh();
  }, [key, refresh]);

  return { data: data ?? [], isLoading, error, refresh };
}
