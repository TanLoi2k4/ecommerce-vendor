import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../api/client';
import * as shipmentApi from '../api/shipmentApi';
import type { SubOrderStatus } from '../types/order';
import { shouldFetchShipment } from '../types/order';
import type { Shipment } from '../types/shipment';
import { isTerminalShipmentStatus } from '../types/shipment';
import { translateShipmentError } from '../utils/shipmentLabels';

const AGGRESSIVE_POLL_MS = 5000;
const AGGRESSIVE_POLL_DURATION_MS = 30000;
const BACKOFF_POLL_MS = 30000;

function isShipmentNotFoundError(err: unknown): boolean {
  const message =
    err instanceof ApiRequestError
      ? err.message
      : err instanceof Error
        ? err.message
        : '';
  const normalized = message.toLowerCase();
  return (
    normalized.includes('shipment not found') ||
    normalized.includes('chưa có vận đơn')
  );
}

export function useVendorShipmentBySubOrder(
  subOrderId: number | null,
  subOrderStatus: SubOrderStatus | null | undefined
) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const aggressiveUntilRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const enabled =
    subOrderId != null &&
    !Number.isNaN(subOrderId) &&
    subOrderStatus != null &&
    shouldFetchShipment(subOrderStatus);

  const fetchShipment = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || subOrderId == null) {
        setShipment(null);
        setNotFound(false);
        setError(null);
        return null;
      }

      if (!options?.silent) setLoading(true);
      setError(null);

      try {
        const data = await shipmentApi.getVendorShipmentBySubOrder(subOrderId);
        setShipment((prev) =>
          prev && JSON.stringify(prev) === JSON.stringify(data) ? prev : data
        );
        setNotFound(false);
        return data;
      } catch (err) {
        if (isShipmentNotFoundError(err)) {
          setShipment(null);
          setNotFound(true);
          setError(null);
          return null;
        }
        const raw = err instanceof Error ? err.message : 'Không tải được vận đơn';
        setError(translateShipmentError(raw));
        return null;
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [enabled, subOrderId]
  );

  const startAggressivePoll = useCallback(() => {
    aggressiveUntilRef.current = Date.now() + AGGRESSIVE_POLL_DURATION_MS;
    void fetchShipment({ silent: true });
  }, [fetchShipment]);

  useEffect(() => {
    void fetchShipment();
  }, [fetchShipment]);

  useEffect(() => {
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!enabled) return;

    const shouldPoll =
      notFound ||
      subOrderStatus === 'SHIPPING_REQUESTED' ||
      (shipment != null && !isTerminalShipmentStatus(shipment.status));

    if (!shouldPoll) return;

    const schedulePoll = () => {
      const aggressiveUntil = aggressiveUntilRef.current;
      const intervalMs =
        aggressiveUntil != null && Date.now() < aggressiveUntil
          ? AGGRESSIVE_POLL_MS
          : BACKOFF_POLL_MS;

      pollTimerRef.current = window.setTimeout(() => {
        void fetchShipment({ silent: true });
        schedulePoll();
      }, intervalMs);
    };

    schedulePoll();

    return () => {
      if (pollTimerRef.current != null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [
    enabled,
    notFound,
    subOrderStatus,
    shipment?.id,
    shipment?.status,
    fetchShipment,
  ]);

  return {
    shipment,
    loading,
    error,
    notFound,
    refresh: fetchShipment,
    startAggressivePoll,
  };
}
