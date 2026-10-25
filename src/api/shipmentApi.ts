/**
 * shipmentApi — shipment-service vendor endpoints via gateway (/api/shipments/vendor).
 * Response unwrapped by axios interceptor → res.data is inner payload.
 */
import api from './client';
import type { Shipment, ShipmentTracking, ActiveCarrier } from '../types/shipment';
import { normalizeShipment, normalizeShipmentTracking } from '../types/shipment';

/** GET /shipments/vendor — danh sách shipment của vendor (scoped theo JWT) */
export async function getVendorShipments(): Promise<Shipment[]> {
  const res = await api.get<Shipment[]>('/shipments/vendor');
  return (res.data ?? []).map(normalizeShipment);
}

/** GET /shipments/vendor/by-suborder/{subOrderId} */
export async function getVendorShipmentBySubOrder(
  subOrderId: number,
  type?: 'OUTBOUND' | 'RETURN'
): Promise<Shipment> {
  const res = await api.get<Shipment>(
    `/shipments/vendor/by-suborder/${encodeURIComponent(String(subOrderId))}`,
    { params: type ? { type } : undefined }
  );
  return normalizeShipment(res.data!);
}

/** GET /shipments/vendor/{id} */
export async function getVendorShipmentById(shipmentId: number): Promise<Shipment> {
  const res = await api.get<Shipment>(
    `/shipments/vendor/${encodeURIComponent(String(shipmentId))}`
  );
  return normalizeShipment(res.data!);
}

/** GET /shipments/vendor/{id}/tracking */
export async function getVendorShipmentTracking(
  shipmentId: number
): Promise<ShipmentTracking[]> {
  const res = await api.get<ShipmentTracking[]>(
    `/shipments/vendor/${encodeURIComponent(String(shipmentId))}/tracking`
  );
  return (res.data ?? []).map(normalizeShipmentTracking);
}

/** GET /shipments/carriers — đơn vị admin đã cấu hình và đang hoạt động */
export async function getActiveCarriers(): Promise<ActiveCarrier[]> {
  const res = await api.get<ActiveCarrier[]>('/shipments/carriers');
  return res.data ?? [];
}
