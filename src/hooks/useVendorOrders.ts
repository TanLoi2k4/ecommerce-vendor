import { useCallback, useEffect, useState } from 'react';
import * as orderApi from '../api/orderApi';
import type { SubOrderDetail, SubOrderListResult, SubOrderStatus, VendorSubOrderStats, OrderStatsPeriod } from '../types/order';
import { getOrderErrorMessage } from '../utils/orderErrors';

interface UseVendorOrdersOptions {
  page?: number;
  size?: number;
  status?: SubOrderStatus;
  customerKeycloakId?: string;
  q?: string;
  enabled?: boolean;
}

export function useVendorOrders(options: UseVendorOrdersOptions = {}) {
  const { page = 1, size = 10, status, customerKeycloakId, q, enabled = true } = options;

  const [result, setResult] = useState<SubOrderListResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderApi.getVendorSubOrders({ page, size, status, customerKeycloakId, q });
      setResult(data);
    } catch (err) {
      setError(getOrderErrorMessage(err, 'Không thể tải danh sách đơn hàng'));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, status, customerKeycloakId, q, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, isLoading, error, refresh };
}

function isSameSubOrderDetail(a: SubOrderDetail, b: SubOrderDetail): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useVendorSubOrderDetail(subOrderId: number | null) {
  const [detail, setDetail] = useState<SubOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (subOrderId == null || Number.isNaN(subOrderId)) {
      setDetail(null);
      return;
    }
    if (!options?.silent) setIsLoading(true);
    if (!options?.silent) setError(null);
    try {
      const data = await orderApi.getVendorSubOrderById(subOrderId);
      setDetail((prev) => (prev && isSameSubOrderDetail(prev, data) ? prev : data));
    } catch (err) {
      if (options?.silent) return;
      setError(getOrderErrorMessage(err, 'Không thể tải chi tiết đơn hàng'));
      setDetail(null);
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, [subOrderId]);

  const applyDetail = useCallback((data: SubOrderDetail) => {
    setDetail(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { detail, isLoading, error, refresh, applyDetail };
}

export function useVendorOrderStats(options: { period?: OrderStatsPeriod; anchor?: string } = {}) {
  const period = options.period ?? 'ALL';
  const anchor = options.anchor;
  const [stats, setStats] = useState<VendorSubOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setStats(await orderApi.getVendorSubOrderStats({ period, anchor }));
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [period, anchor]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, isLoading, refresh };
}
