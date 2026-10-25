import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '../api/productApi';
import type { ProductCategory } from '../types/product';
import { getApiErrorMessage } from '../utils/apiErrors';

export function useCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh mục'));
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, isLoading, error, refresh };
}
