import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../api/client';
import * as flashSaleApi from '../api/flashSaleApi';
import { getVendorProducts } from '../api/productApi';
import type { FlashSaleRequestDto, FlashSaleViewModel } from '../types/discount';
import type { ProductCardModel } from '../types/product';
import { enrichFlashSales } from '../utils/flashSaleMappers';
import { mapFlashSaleApiError } from '../utils/flashSaleValidation';
import { getApiErrorMessage } from '../utils/apiErrors';

function toFlashSaleError(error: unknown, fallback: string): string {
  const status = error instanceof ApiRequestError ? error.status : undefined;
  const raw = getApiErrorMessage(error, fallback);
  return mapFlashSaleApiError(raw, status);
}

export function useFlashSales() {
  const [flashSales, setFlashSales] = useState<FlashSaleViewModel[]>([]);
  const [activeFlashSales, setActiveFlashSales] = useState<FlashSaleViewModel[]>([]);
  const [vendorProducts, setVendorProducts] = useState<ProductCardModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    const result = await getVendorProducts({ page: 1, size: 100 });
    const active = result.data.filter((p) => !p.deleted);
    setVendorProducts(active);
    return active;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [all, active, products] = await Promise.all([
        flashSaleApi.getFlashSales(),
        flashSaleApi.getActiveFlashSales(),
        loadProducts(),
      ]);
      setFlashSales(enrichFlashSales(all, products));
      setActiveFlashSales(enrichFlashSales(active, products));
    } catch (err) {
      setError(toFlashSaleError(err, 'Không thể tải danh sách flash sale'));
      setFlashSales([]);
      setActiveFlashSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (request: FlashSaleRequestDto) => {
      setIsSubmitting(true);
      try {
        const created = await flashSaleApi.createFlashSale(request);
        await refresh();
        return created;
      } catch (err) {
        const message = toFlashSaleError(err, 'Không thể tạo flash sale');
        throw new ApiRequestError(message, undefined, err instanceof ApiRequestError ? err.status : undefined);
      } finally {
        setIsSubmitting(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      setIsSubmitting(true);
      try {
        await flashSaleApi.deleteFlashSale(id);
        await refresh();
      } catch (err) {
        const message = toFlashSaleError(err, 'Không thể xóa flash sale');
        throw new ApiRequestError(message, undefined, err instanceof ApiRequestError ? err.status : undefined);
      } finally {
        setIsSubmitting(false);
      }
    },
    [refresh]
  );

  return {
    flashSales,
    activeFlashSales,
    vendorProducts,
    isLoading,
    isSubmitting,
    error,
    refresh,
    create,
    remove,
  };
}
