import { useCallback, useEffect, useState } from 'react';
import { getProductReviews } from '../api/productApi';
import type { PaginatedResult, ProductReview } from '../types/product';
import { getApiErrorMessage } from '../utils/apiErrors';

interface UseProductReviewsOptions {
  productId: number;
  page?: number;
  size?: number;
  rating?: number;
  enabled?: boolean;
}

export function useProductReviews(options: UseProductReviewsOptions) {
  const { productId, page = 1, size = 10, rating, enabled = true } = options;

  const [result, setResult] = useState<PaginatedResult<ProductReview> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !productId || Number.isNaN(productId)) return;

    setIsLoading(true);
    setError(null);
    try {
      const fetchSize = rating != null ? 100 : size;
      const data = await getProductReviews(productId, {
        page: rating != null ? 1 : page,
        size: fetchSize,
        rating,
      });
      if (rating == null) {
        setResult(data);
        return;
      }
      const matched = data.data.filter((review) => Number(review.rating) === rating);
      const start = (page - 1) * size;
      setResult({
        ...data,
        data: matched.slice(start, start + size),
        total: matched.length,
        totalPages: Math.max(1, Math.ceil(matched.length / size)),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải đánh giá'));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, size, rating, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, isLoading, error, refresh };
}
