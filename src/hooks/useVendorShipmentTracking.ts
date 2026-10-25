import { useCallback, useEffect, useRef, useState } from 'react';
import * as shipmentApi from '../api/shipmentApi';
import type { Shipment, ShipmentTracking } from '../types/shipment';
import { isTerminalShipmentStatus } from '../types/shipment';
import { translateShipmentError } from '../utils/shipmentLabels';

const POLL_INTERVAL_MS = 30000;

type UseVendorShipmentTrackingOptions = {
  enabled?: boolean;
  pollIntervalMs?: number;
};

export function useVendorShipmentTracking(
  shipment: Shipment | null | undefined,
  options: UseVendorShipmentTrackingOptions = {}
) {
  const { enabled = true, pollIntervalMs = POLL_INTERVAL_MS } = options;
  const [events, setEvents] = useState<ShipmentTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!shipment?.id) {
      setEvents([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const data = await shipmentApi.getVendorShipmentTracking(shipment.id);
      setEvents(data);
      return data;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Không tải được lịch sử vận chuyển';
      setError(translateShipmentError(raw));
      setEvents([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [shipment?.id]);

  useEffect(() => {
    if (!enabled || !shipment?.id) {
      setEvents([]);
      return;
    }
    void fetchTracking();
  }, [enabled, shipment?.id, fetchTracking]);

  useEffect(() => {
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!enabled || !shipment?.id) return;
    if (isTerminalShipmentStatus(shipment.status)) return;

    pollTimerRef.current = window.setInterval(() => {
      void fetchTracking();
    }, pollIntervalMs);

    return () => {
      if (pollTimerRef.current != null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [enabled, shipment?.id, shipment?.status, pollIntervalMs, fetchTracking]);

  return { events, loading, error, refresh: fetchTracking };
}
