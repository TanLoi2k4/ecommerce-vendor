import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../api/client';
import * as flashSaleApi from '../api/flashSaleApi';
import { getProductById } from '../api/productApi';
import type { FlashSaleViewModel } from '../types/discount';
import { toProductCardModelFromDetail } from '../types/product';
import { enrichFlashSale } from '../utils/flashSaleMappers';
import { mapFlashSaleApiError } from '../utils/flashSaleValidation';
import { getApiErrorMessage } from '../utils/apiErrors';

function toFlashSaleError(error: unknown, fallback: string): string {
  const status = error instanceof ApiRequestError ? error.status : undefined;
  const raw = getApiErrorMessage(error, fallback);
  return mapFlashSaleApiError(raw, status);
}

export function useFlashSaleDetail(flashSaleId: number | null) {
  const [sale, setSale] = useState<FlashSaleViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (flashSaleId == null || Number.isNaN(flashSaleId)) {
      setSale(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const dto = await flashSaleApi.getFlashSaleById(flashSaleId);
      let enriched: FlashSaleViewModel = { ...dto };

      try {
        const product = await getProductById(dto.productId);
        enriched = enrichFlashSale(dto, new Map([[product.id, toProductCardModelFromDetail(product)]]));
      } catch {
        enriched = enrichFlashSale(dto, new Map());
      }

      setSale(enriched);
    } catch (err) {
      setError(toFlashSaleError(err, 'Không thể tải flash sale'));
      setSale(null);
    } finally {
      setIsLoading(false);
    }
  }, [flashSaleId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(async () => {
    if (flashSaleId == null || Number.isNaN(flashSaleId)) return;

    setIsSubmitting(true);
    try {
      await flashSaleApi.deleteFlashSale(flashSaleId);
    } catch (err) {
      const message = toFlashSaleError(err, 'Không thể xóa flash sale');
      throw new ApiRequestError(
        message,
        undefined,
        err instanceof ApiRequestError ? err.status : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [flashSaleId]);

  return { sale, isLoading, isSubmitting, error, refresh, remove };
}
