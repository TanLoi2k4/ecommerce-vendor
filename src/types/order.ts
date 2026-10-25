/**
 * Types aligned with order-service vendor DTOs (SubOrder / OrderItem).
 */
import type { PaginatedResult } from './product';

/** Matches order-service SubOrderStatus */
export type SubOrderStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'SHIPPING_REQUESTED'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED';

/** Matches order-service OrderItemStatus */
export type OrderItemStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'RETURNED';

/** Matches order-service PayoutStatus on sub-order (not payment-service VendorPayout). */
export type SubOrderPayoutStatus = 'PENDING' | 'PAID' | 'CANCELLED';

/** Matches order-service PaymentStatus */
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

/** Matches order-service PaymentMethod */
export type PaymentMethod = 'COD' | 'VNPAY' | 'WALLET';

/** Matches order-service OrderItemResponse */
export interface OrderItemDto {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: OrderItemStatus;
}

/** Parent order fields embedded in SubOrder DTOs */
export interface SubOrderOrderContext {
  orderCode?: string | null;
  createdAt?: string | null;
  customerKeycloakId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  note?: string | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: PaymentMethod | null;
}

/** Matches order-service SubOrderSummaryResponse */
export interface SubOrderSummary extends SubOrderOrderContext {
  id: number;
  status: SubOrderStatus;
  payoutStatus: SubOrderPayoutStatus;
  subtotal: number;
  finalAmount: number;
}

export type ReturnRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'REJECTED'
  | 'DISPUTED'
  | 'CLOSED';

export type ReturnReason =
  | 'WRONG_ITEM'
  | 'DAMAGED'
  | 'NOT_AS_DESCRIBED'
  | 'MISSING_PARTS'
  | 'CHANGED_MIND'
  | 'OTHER';

export interface ReturnRequestItemDto {
  id: number;
  orderItemId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReturnRequestDto {
  id: number;
  subOrderId: number;
  orderCode: string;
  customerKeycloakId: string;
  vendorKeycloakId: string;
  status: ReturnRequestStatus;
  reason: ReturnReason;
  description?: string | null;
  sellerNote?: string | null;
  customerShipNote?: string | null;
  adminNote?: string | null;
  refundAmount: number;
  currency: string;
  items: ReturnRequestItemDto[];
  createdAt: string;
  updatedAt?: string | null;
  approvedAt?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
  refundedAt?: string | null;
  sellerRespondBy?: string | number | null;
  returnShipmentId?: number | null;
  returnExternalShipmentId?: string | null;
  returnCarrierCode?: string | null;
}

export const RETURN_STATUS_LABELS: Record<ReturnRequestStatus, string> = {
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Chờ lấy hàng hoàn',
  SHIPPED: 'Đang hoàn về shop',
  RECEIVED: 'Đối tác vận chuyển đã giao tới',
  REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Đã từ chối',
  DISPUTED: 'Khiếu nại',
  CLOSED: 'Đã đóng',
};

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  WRONG_ITEM: 'Sai sản phẩm',
  DAMAGED: 'Hàng hỏng / lỗi',
  NOT_AS_DESCRIBED: 'Không đúng mô tả',
  MISSING_PARTS: 'Thiếu phụ kiện',
  CHANGED_MIND: 'Đổi ý',
  OTHER: 'Lý do khác',
};

/** Matches order-service SubOrderResponse */
export interface SubOrderDetail extends SubOrderOrderContext {
  id: number;
  vendorKeycloakId: string;
  status: SubOrderStatus;
  payoutStatus: SubOrderPayoutStatus;
  payoutRef?: string | null;
  payoutAt?: string | null;
  completedAt?: string | null;
  returns?: ReturnRequestDto[];
  subtotal: number;
  finalAmount: number;
  items: OrderItemDto[];
}

/** Matches order-service PageResponse<T> */
export interface OrderPageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type SubOrderListResult = PaginatedResult<SubOrderSummary>;

export type OrderStatsPeriod = 'ALL' | 'WEEK' | 'MONTH' | 'YEAR';

export interface VendorStatsPeriodSlice {
  granularity: OrderStatsPeriod;
  from?: string | null;
  to?: string | null;
  label: string;
  total: number;
  byStatus: Partial<Record<SubOrderStatus, number>>;
}

export interface VendorSubOrderStats {
  total: number;
  byStatus: Partial<Record<SubOrderStatus, number>>;
  period?: VendorStatsPeriodSlice | null;
}

/** Matches order-service ShipmentRequest */
export interface ShipmentRequest {
  pickupAddress?: string;
  serviceLevel?: string;
  carrierPreference?: string;
}

/** Matches order-service UpdateSubOrderStatusRequest */
export interface UpdateSubOrderStatusRequest {
  status: 'PROCESSING' | 'CANCELLED';
}

/** Matches order-service UpdateOrderItemStatusRequest */
export interface UpdateOrderItemStatusRequest {
  status: 'CONFIRMED' | 'CANCELLED';
}

/** Service levels for vendor shipping request */
export const SHIPPING_SERVICE_LEVELS = [
  { value: 'STANDARD', label: 'Tiêu chuẩn' },
  { value: 'EXPRESS', label: 'Hỏa tốc' },
  { value: 'SAME_DAY', label: 'Giao trong ngày' },
] as const;

/** Main vendor workflow steps for timeline UI */
export const SUB_ORDER_WORKFLOW_STEPS: { status: SubOrderStatus; label: string }[] = [
  { status: 'CREATED', label: 'Mới' },
  { status: 'PROCESSING', label: 'Đang xử lý' },
  { status: 'SHIPPING_REQUESTED', label: 'Yêu cầu giao hàng' },
  { status: 'SHIPPING', label: 'Đang vận chuyển' },
  { status: 'COMPLETED', label: 'Hoàn thành' },
];

export function subOrderProgressIndex(status: SubOrderStatus): number {
  const ranks: Record<SubOrderStatus, number> = {
    CREATED: 0,
    PROCESSING: 1,
    SHIPPING_REQUESTED: 2,
    SHIPPING: 3,
    COMPLETED: 4,
    CANCELLED: -1,
    RETURNED: -1,
  };
  return ranks[status];
}

export function allItemsHandled(items: OrderItemDto[]): boolean {
  return items.length > 0 && items.every((i) => i.status !== 'PENDING');
}

export function hasConfirmedItem(items: OrderItemDto[]): boolean {
  return items.some((i) => i.status === 'CONFIRMED');
}

export function canUpdateItems(subOrderStatus: SubOrderStatus): boolean {
  return subOrderStatus === 'CREATED';
}

export function canProcessSubOrder(
  subOrderStatus: SubOrderStatus,
  items: OrderItemDto[]
): boolean {
  return (
    subOrderStatus === 'CREATED' &&
    allItemsHandled(items) &&
    hasConfirmedItem(items)
  );
}

export function canCancelSubOrder(subOrderStatus: SubOrderStatus): boolean {
  return subOrderStatus === 'CREATED' || subOrderStatus === 'PROCESSING';
}

export function canRequestShipping(
  subOrderStatus: SubOrderStatus,
  items: OrderItemDto[],
  paymentStatus?: PaymentStatus | null,
  paymentMethod?: PaymentMethod | null
): boolean {
  if (subOrderStatus !== 'PROCESSING') return false;
  if (!hasConfirmedItem(items)) return false;
  if (paymentMethod === 'COD') return true;
  return paymentStatus === 'COMPLETED';
}

export function isSubOrderTerminal(status: SubOrderStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'RETURNED';
}

/** UI view model — item enriched with product-service data */
export interface SubOrderItemView extends OrderItemDto {
  productName: string;
  productImage: string;
}

/** UI view model for order detail page */
export interface SubOrderDetailView extends Omit<SubOrderDetail, 'items'> {
  items: SubOrderItemView[];
}

export const SUB_ORDER_STATUS_LABELS: Record<SubOrderStatus, string> = {
  CREATED: 'Mới',
  PROCESSING: 'Đang xử lý',
  SHIPPING_REQUESTED: 'Yêu cầu giao hàng',
  SHIPPING: 'Đang vận chuyển',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã trả hàng',
};

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã trả hàng',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  COMPLETED: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPay',
  WALLET: 'Ví',
};

export const SUB_ORDER_PAYOUT_STATUS_LABELS: Record<SubOrderPayoutStatus, string> = {
  PENDING: 'Chờ quyết toán',
  PAID: 'Đã thanh toán cho nhà bán',
  CANCELLED: 'Đã hủy',
};

export function subOrderPayoutStatusColor(status: SubOrderPayoutStatus): string {
  const map: Record<SubOrderPayoutStatus, string> = {
    PENDING: 'warning',
    PAID: 'success',
    CANCELLED: 'gray',
  };
  return map[status] ?? 'gray';
}

/** Explains why shipping may be blocked for prepaid orders */
export function getPaymentGatingMessage(
  paymentMethod?: PaymentMethod | null,
  paymentStatus?: PaymentStatus | null
): string | null {
  if (!paymentMethod || paymentMethod === 'COD') return null;
  if (paymentStatus === 'COMPLETED') return null;

  if (paymentStatus === 'PENDING') {
    return 'Khách hàng chưa hoàn tất thanh toán. Bạn có thể yêu cầu giao hàng sau khi thanh toán thành công.';
  }
  if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
    return 'Thanh toán của khách hàng không thành công. Không thể giao hàng cho đến khi thanh toán hoàn tất.';
  }
  if (paymentStatus === 'REFUNDED' || paymentStatus === 'PARTIALLY_REFUNDED') {
    return 'Thanh toán đã được hoàn cho khách hàng. Vui lòng kiểm tra lại các mặt hàng trước khi giao hàng.';
  }
  return 'Đơn trả trước cần thanh toán hoàn tất trước khi bạn có thể yêu cầu giao hàng.';
}

export function isRefundedPaymentStatus(status?: PaymentStatus | null): boolean {
  return status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED';
}

/** Route slug (sidebar) → backend SubOrderStatus filter */
export const ORDER_ROUTE_STATUS_MAP: Record<string, SubOrderStatus | undefined> = {
  pending: 'CREATED',
  created: 'CREATED',
  processing: 'PROCESSING',
  'shipping-requested': 'SHIPPING_REQUESTED',
  shipped: 'SHIPPING',
  shipping: 'SHIPPING',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  returned: 'RETURNED',
};

/** Sub-order statuses where shipment-service data may exist */
export const SHIPMENT_VISIBLE_SUB_ORDER_STATUSES: SubOrderStatus[] = [
  'SHIPPING_REQUESTED',
  'SHIPPING',
  'COMPLETED',
  'RETURNED',
];

export function shouldFetchShipment(status: SubOrderStatus): boolean {
  return SHIPMENT_VISIBLE_SUB_ORDER_STATUSES.includes(status);
}

export function mapOrderPageResponse<T>(
  page: OrderPageResponse<T>,
  uiPage: number,
  limit: number
): PaginatedResult<T> {
  return {
    data: page.items ?? [],
    total: page.totalElements ?? 0,
    page: uiPage,
    limit,
    totalPages: page.totalPages ?? 0,
  };
}

export function subOrderStatusColor(status: SubOrderStatus | OrderItemStatus): string {
  const map: Record<string, string> = {
    CREATED: 'warning',
    PROCESSING: 'primary',
    SHIPPING_REQUESTED: 'primary',
    SHIPPING: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'error',
    RETURNED: 'error',
    PENDING: 'warning',
    CONFIRMED: 'success',
  };
  return map[status] ?? 'gray';
}

export function paymentStatusColor(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'gray',
    FAILED: 'error',
    REFUNDED: 'gray',
    PARTIALLY_REFUNDED: 'warning',
  };
  return map[status] ?? 'gray';
}
