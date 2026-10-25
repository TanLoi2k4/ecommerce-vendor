import { useCallback, useState } from 'react';
import * as orderApi from '../api/orderApi';
import type { ShipmentRequest, SubOrderDetail } from '../types/order';
import { getOrderErrorMessage } from '../utils/orderErrors';
import { toast } from '../components/ui';

export function useVendorSubOrderActions(
  subOrderId: number | null,
  onUpdated?: (detail: SubOrderDetail) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingItemId, setActingItemId] = useState<number | null>(null);

  const run = useCallback(
    async (action: () => Promise<SubOrderDetail>, successMessage: string) => {
      if (subOrderId == null || Number.isNaN(subOrderId)) return;
      setIsSubmitting(true);
      try {
        const detail = await action();
        toast.success(successMessage);
        onUpdated?.(detail);
        return detail;
      } catch (err) {
        toast.error(getOrderErrorMessage(err, 'Thao tác thất bại'));
        throw err;
      } finally {
        setIsSubmitting(false);
        setActingItemId(null);
      }
    },
    [subOrderId, onUpdated]
  );

  const confirmItem = useCallback(
    async (itemId: number) => {
      if (subOrderId == null) return;
      setActingItemId(itemId);
      return run(
        () => orderApi.updateOrderItemStatus(subOrderId, itemId, 'CONFIRMED'),
        'Đã xác nhận sản phẩm'
      );
    },
    [subOrderId, run]
  );

  const cancelItem = useCallback(
    async (itemId: number) => {
      if (subOrderId == null) return;
      setActingItemId(itemId);
      return run(
        () => orderApi.updateOrderItemStatus(subOrderId, itemId, 'CANCELLED'),
        'Đã đánh dấu hết hàng / hủy sản phẩm'
      );
    },
    [subOrderId, run]
  );

  const processSubOrder = useCallback(async () => {
    if (subOrderId == null) return;
    return run(
      () => orderApi.updateSubOrderStatus(subOrderId, 'PROCESSING'),
      'Sub-order đã chuyển sang xử lý'
    );
  }, [subOrderId, run]);

  const cancelSubOrder = useCallback(async () => {
    if (subOrderId == null) return;
    return run(
      () => orderApi.updateSubOrderStatus(subOrderId, 'CANCELLED'),
      'Sub-order đã bị hủy'
    );
  }, [subOrderId, run]);

  const requestShipping = useCallback(
    async (request: ShipmentRequest) => {
      if (subOrderId == null) return;
      return run(
        () => orderApi.requestSubOrderShipping(subOrderId, request),
        'Đã gửi yêu cầu vận chuyển'
      );
    },
    [subOrderId, run]
  );

  return {
    isSubmitting,
    actingItemId,
    confirmItem,
    cancelItem,
    processSubOrder,
    cancelSubOrder,
    requestShipping,
  };
}
