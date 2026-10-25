import type { ShipmentStatus } from '../types/shipment';

export const shipmentStatusLabel: Record<ShipmentStatus, string> = {
  CREATED: 'Đã tạo vận đơn',
  BOOKING_FAILED: 'Đặt vận chuyển thất bại',
  BOOKED: 'Đã đặt vận chuyển',
  PICKED_UP: 'Shipper đã lấy hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERED: 'Đã giao hàng',
  FAILED_DELIVERY: 'Giao hàng thất bại',
  RETURNING: 'Đang hoàn trả',
  RETURNED: 'Đã hoàn trả',
  CANCELLED: 'Đã hủy vận chuyển',
};

export const carrierCodeLabel: Record<string, string> = {
  GIAOHANG_NHANH: 'Giao Hàng Nhanh',
  GHTK: 'Giao Hàng Tiết Kiệm',
  VIETTEL_POST: 'Viettel Post',
};

export function formatCarrierLabel(
  carrierCode?: string | null,
  carrierName?: string | null
): string {
  if (carrierName?.trim()) return carrierName;
  if (!carrierCode) return 'Đơn vị vận chuyển';
  return carrierCodeLabel[carrierCode] ?? carrierCode;
}

export function shipmentStatusColor(status: ShipmentStatus): string {
  const map: Record<ShipmentStatus, string> = {
    CREATED: 'primary',
    BOOKING_FAILED: 'error',
    BOOKED: 'primary',
    PICKED_UP: 'primary',
    IN_TRANSIT: 'primary',
    DELIVERED: 'success',
    FAILED_DELIVERY: 'error',
    RETURNING: 'warning',
    RETURNED: 'warning',
    CANCELLED: 'error',
  };
  return map[status] ?? 'gray';
}

/** Map message lỗi shipment phổ biến sang tiếng Việt */
export function translateShipmentError(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('access denied')) {
    return 'Bạn không có quyền xem vận đơn này.';
  }
  if (normalized.includes('shipment not found')) {
    return 'Chưa có vận đơn cho đơn shop này.';
  }
  if (normalized.includes('booking failed') || normalized.includes('booking_failed')) {
    return 'Đặt vận chuyển thất bại. Vui lòng thử lại.';
  }

  return message;
}
