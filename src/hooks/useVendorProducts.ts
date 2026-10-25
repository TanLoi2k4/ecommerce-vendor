import { useCallback, useState } from 'react';
import * as productApi from '../api/productApi';
import type { PaginatedResult, ProductCardModel } from '../types/product';
import { getApiErrorMessage } from '../utils/apiErrors';
import { useAutoRefresh } from './useAutoRefresh';

interface UseVendorProductsOptions {
  deleted?: boolean;
  page?: number;
  size?: number;
  query?: string;
  enabled?: boolean;
}

export function useVendorProducts(options: UseVendorProductsOptions = {}) {
  const {
    deleted = false,
    page = 1,
    size = 12,
    query,
    enabled = true,
  } = options;

  const [result, setResult] = useState<PaginatedResult<ProductCardModel> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) setIsLoading(true);
      setError(null);
      try {
        const data = deleted
          ? await productApi.getVendorDeletedProducts({ page, size, query })
          : await productApi.getVendorProducts({ page, size, query });
        setResult(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không thể tải sản phẩm'));
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [deleted, page, size, query, enabled]
  );

  useAutoRefresh(({ silent }) => {
    void fetchProducts(silent);
  }, [fetchProducts]);

  const refresh = useCallback(async () => {
    await fetchProducts(false);
  }, [fetchProducts]);

  return { result, isLoading, error, refresh };
}
