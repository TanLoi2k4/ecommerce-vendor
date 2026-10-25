import { useCallback, useEffect, useMemo, useState } from 'react';
import * as shipmentApi from '../api/shipmentApi';
import type { Shipment } from '../types/shipment';
import { mapShipmentsBySubOrderId, sortShipmentsByUpdatedAt } from '../types/shipment';
import { translateShipmentError } from '../utils/shipmentLabels';

export function useVendorShipments(enabled = true) {
  const [shipmentsBySubOrder, setShipmentsBySubOrder] = useState<Record<number, Shipment>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setShipmentsBySubOrder({});
      return {};
    }

    setLoading(true);
    setError(null);

    try {
      const shipments = await shipmentApi.getVendorShipments();
      const mapped = mapShipmentsBySubOrderId(shipments);
      setShipmentsBySubOrder(mapped);
      return mapped;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Không tải được danh sách vận đơn';
      setError(translateShipmentError(raw));
      setShipmentsBySubOrder({});
      return {};
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getShipmentForSubOrder = useCallback(
    (subOrderId: number) => shipmentsBySubOrder[subOrderId],
    [shipmentsBySubOrder]
  );

  const shipments = useMemo(
    () => sortShipmentsByUpdatedAt(Object.values(shipmentsBySubOrder)),
    [shipmentsBySubOrder]
  );

  return {
    shipments,
    shipmentsBySubOrder,
    loading,
    error,
    refresh,
    getShipmentForSubOrder,
  };
}
