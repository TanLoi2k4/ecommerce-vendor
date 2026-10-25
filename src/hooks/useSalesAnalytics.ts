import { useCallback, useEffect, useRef, useState } from 'react';
import { getSalesAnalytics } from '../api/analyticsApi';
import type { AnalyticsPeriodQuery, SalesAnalyticsResponse } from '../types/analytics';
import { getAnalyticsCache, setAnalyticsCache } from './analyticsCache';
import { todayAnchor } from '../utils/orderStatsPeriod';

function cacheKey(query: AnalyticsPeriodQuery): string {
  const period = query.period ?? 'MONTH';
  const anchor = period === 'ALL' ? 'all' : query.anchor || todayAnchor();
  return `analytics:vendor:sales:${period}:${anchor}`;
}

export function useSalesAnalytics(query: AnalyticsPeriodQuery = {}) {
  const period = query.period ?? 'MONTH';
  const anchor = query.anchor;
  const key = cacheKey(query);
  const [data, setData] = useState<SalesAnalyticsResponse | null>(() =>
    getAnalyticsCache<SalesAnalyticsResponse>(key)
  );
  const [dataKey, setDataKey] = useState(key);
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const aligned = dataKey === key;
  const viewData = aligned ? data : getAnalyticsCache<SalesAnalyticsResponse>(key);
  const viewLoading = aligned ? isLoading : viewData == null;

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const cached = getAnalyticsCache<SalesAnalyticsResponse>(key);
    if (cached) {
      if (requestId !== requestIdRef.current) return cached;
      setData(cached);
      setDataKey(key);
      setIsLoading(false);
      return cached;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getSalesAnalytics({ period, anchor });
      if (requestId !== requestIdRef.current) return result;
      setAnalyticsCache(key, result);
      setData(result);
      setDataKey(key);
      return result;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;
      const message = err instanceof Error ? err.message : 'Không thể tải sales analytics';
      setError(message);
      setData(null);
      setDataKey(key);
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [anchor, key, period]);

  useEffect(() => {
    const cached = getAnalyticsCache<SalesAnalyticsResponse>(key);
    setData(cached);
    setDataKey(key);
    setIsLoading(!cached);
    refresh();
  }, [key, refresh]);

  return { data: viewData, isLoading: viewLoading, error, refresh };
}
