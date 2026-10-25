/**
 * orderApi — order-service vendor endpoints via gateway (/api/orders/vendor).
 * Response unwrapped by axios interceptor → res.data is inner payload.
 */
import api from './client';
import type {
  OrderPageResponse,
  ReturnRequestDto,
  ReturnRequestStatus,
  ShipmentRequest,
  SubOrderDetail,
  SubOrderListResult,
  SubOrderStatus,
  SubOrderSummary,
  VendorSubOrderStats,
  OrderStatsPeriod,
} from '../types/order';
import { mapOrderPageResponse } from '../types/order';

export type VendorSubOrderListParams = {
  /** 1-based page for UI */
  page?: number;
  size?: number;
  status?: SubOrderStatus;
  customerKeycloakId?: string;
  q?: string;
};

function toApiPageParams(params: VendorSubOrderListParams = {}) {
  const q = params.q?.trim();
  return {
    page: Math.max(0, (params.page ?? 1) - 1),
    size: params.size ?? 10,
    ...(params.status ? { status: params.status } : {}),
    ...(params.customerKeycloakId ? { customerKeycloakId: params.customerKeycloakId } : {}),
    ...(q ? { q } : {}),
  };
}

export async function getVendorSubOrders(
  params?: VendorSubOrderListParams
): Promise<SubOrderListResult> {
  const uiPage = params?.page ?? 1;
  const limit = params?.size ?? 10;
  const res = await api.get<OrderPageResponse<SubOrderSummary>>('/orders/vendor', {
    params: toApiPageParams(params),
  });
  const page = res.data ?? {
    items: [],
    page: 0,
    size: limit,
    totalElements: 0,
    totalPages: 0,
    last: true,
  };
  return mapOrderPageResponse(page, uiPage, limit);
}

export type VendorStatsParams = {
  period?: OrderStatsPeriod;
  anchor?: string;
};

export async function getVendorSubOrderStats(
  params?: VendorStatsParams
): Promise<VendorSubOrderStats> {
  const period = params?.period ?? 'ALL';
  const res = await api.get<VendorSubOrderStats>('/orders/vendor/stats', {
    params: {
      period,
      ...(period !== 'ALL' && params?.anchor ? { anchor: params.anchor } : {}),
    },
  });
  return (
    res.data ?? {
      total: 0,
      byStatus: {},
    }
  );
}

export async function getVendorSubOrderById(id: number): Promise<SubOrderDetail> {
  const res = await api.get<SubOrderDetail>(`/orders/vendor/${id}`);
  if (!res.data) {
    throw new Error('Sub-order not found');
  }
  return res.data;
}

export async function updateOrderItemStatus(
  subOrderId: number,
  itemId: number,
  status: 'CONFIRMED' | 'CANCELLED'
): Promise<SubOrderDetail> {
  const res = await api.put<SubOrderDetail>(
    `/orders/vendor/${subOrderId}/items/${itemId}/status`,
    { status }
  );
  if (!res.data) throw new Error('Không thể cập nhật trạng thái mặt hàng');
  return res.data;
}

export async function updateSubOrderStatus(
  subOrderId: number,
  status: 'PROCESSING' | 'CANCELLED'
): Promise<SubOrderDetail> {
  const res = await api.put<SubOrderDetail>(`/orders/vendor/${subOrderId}/status`, {
    status,
  });
  if (!res.data) throw new Error('Không thể cập nhật trạng thái đơn hàng');
  return res.data;
}

export async function getVendorReturns(params?: {
  page?: number;
  size?: number;
  status?: ReturnRequestStatus;
}): Promise<OrderPageResponse<ReturnRequestDto>> {
  const res = await api.get<OrderPageResponse<ReturnRequestDto>>('/orders/vendor/returns', {
    params: {
      page: Math.max(0, (params?.page ?? 1) - 1),
      size: params?.size ?? 10,
      ...(params?.status ? { status: params.status } : {}),
    },
  });
  return (
    res.data ?? {
      items: [],
      page: 0,
      size: params?.size ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }
  );
}

export async function approveVendorReturn(returnId: number, note?: string): Promise<ReturnRequestDto> {
  const res = await api.post<ReturnRequestDto>(`/orders/vendor/returns/${returnId}/approve`, note ? { note } : {});
  if (!res.data) throw new Error('Không duyệt được yêu cầu trả hàng');
  return res.data;
}

export async function rejectVendorReturn(returnId: number, note: string): Promise<ReturnRequestDto> {
  const res = await api.post<ReturnRequestDto>(`/orders/vendor/returns/${returnId}/reject`, { note });
  if (!res.data) throw new Error('Không từ chối được yêu cầu trả hàng');
  return res.data;
}

export async function requestSubOrderShipping(
  subOrderId: number,
  request: ShipmentRequest
): Promise<SubOrderDetail> {
  const res = await api.post<SubOrderDetail>(
    `/orders/vendor/${subOrderId}/shipping`,
    request
  );
  if (!res.data) throw new Error('Không thể yêu cầu giao hàng');
  return res.data;
}
