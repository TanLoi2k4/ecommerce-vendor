/**
 * Types aligned with shipment-service DTOs (vendor-facing).
 */
export type ShipmentStatus =
  | 'CREATED'
  | 'BOOKING_FAILED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNING'
  | 'RETURNED'
  | 'CANCELLED';

/** Matches ShipmentResponse */
export interface Shipment {
  id: number;
  subOrderId: number;
  orderId?: number | null;
  shipmentType?: 'OUTBOUND' | 'RETURN' | null;
  returnRequestId?: number | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  externalShipmentId: string;
  carrierCode: string;
  carrierName?: string | null;
  carrierTrackingId?: string | null;
  serviceLevel?: string | null;
  externalReference?: string | null;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  mocked?: boolean | null;
}

/** Matches ActiveCarrierResponse — only carriers admin has configured */
export interface ActiveCarrier {
  carrierCode: string;
  carrierName: string;
}

/** Matches ShipmentTrackingResponse */
export interface ShipmentTracking {
  id: number;
  trackingId: string;
  location?: string | null;
  eta?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicle?: string | null;
  rawCarrierData?: string | null;
  createdAt: string;
  updatedAt: string;
}

const TERMINAL_STATUSES: ShipmentStatus[] = ['DELIVERED', 'RETURNED', 'CANCELLED'];

export function isTerminalShipmentStatus(status: ShipmentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function normalizeShipment(raw: Shipment): Shipment {
  return {
    ...raw,
    id: Number(raw.id),
    subOrderId: Number(raw.subOrderId),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    mocked: raw.mocked != null ? Boolean(raw.mocked) : raw.mocked,
  };
}

export function normalizeShipmentTracking(raw: ShipmentTracking): ShipmentTracking {
  return {
    ...raw,
    id: Number(raw.id),
  };
}

export function isOutboundShipment(shipment?: Shipment | null): boolean {
  return shipment?.shipmentType !== 'RETURN';
}

export function findShipmentBySubOrderId(
  shipments: Shipment[],
  subOrderId: number
): Shipment | undefined {
  return shipments.find((s) => s.subOrderId === subOrderId && isOutboundShipment(s));
}

export function mapShipmentsBySubOrderId(
  shipments: Shipment[]
): Record<number, Shipment> {
  return shipments.reduce<Record<number, Shipment>>((acc, shipment) => {
    if (shipment.shipmentType === 'RETURN') return acc;
    acc[shipment.subOrderId] = shipment;
    return acc;
  }, {});
}

/** Route slug → shipment statuses for list filters */
export const SHIPMENT_ROUTE_STATUS_MAP: Record<string, ShipmentStatus[] | undefined> = {
  booked: ['BOOKED'],
  'in-transit': ['PICKED_UP', 'IN_TRANSIT'],
  delivered: ['DELIVERED'],
  'booking-failed': ['BOOKING_FAILED'],
  issues: ['FAILED_DELIVERY', 'RETURNING', 'RETURNED'],
  cancelled: ['CANCELLED'],
};

export function resolveShipmentStatusFilter(
  routeStatus?: string
): ShipmentStatus[] | undefined {
  if (!routeStatus) return undefined;
  return SHIPMENT_ROUTE_STATUS_MAP[routeStatus.toLowerCase()];
}

export function filterShipmentsByStatus(
  shipments: Shipment[],
  statuses?: ShipmentStatus[]
): Shipment[] {
  if (!statuses?.length) return shipments;
  const allowed = new Set(statuses);
  return shipments.filter((shipment) => allowed.has(shipment.status));
}

export function sortShipmentsByUpdatedAt(shipments: Shipment[]): Shipment[] {
  return [...shipments].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
