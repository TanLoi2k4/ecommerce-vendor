import { useCallback, useEffect, useState } from 'react';
import * as productApi from '../api/productApi';
import type { PaginatedResult, VendorReviewView } from '../types/product';
import { getApiErrorMessage } from '../utils/apiErrors';

interface UseVendorReviewsOptions {
  page?: number;
  size?: number;
  query?: string;
  enabled?: boolean;
}

export function useVendorReviews(options: UseVendorReviewsOptions = {}) {
  const { page = 1, size = 10, query, enabled = true } = options;

  const [result, setResult] = useState<PaginatedResult<VendorReviewView> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await productApi.getVendorReviews({ page, size, query });
      setResult(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải đánh giá'));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, query, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, isLoading, error, refresh };
}
