/**
 * flashSaleApi — discount-service via gateway (/api/flash-sales).
 * Response unwrapped by axios interceptor → res.data is inner payload.
 */
import api from './client';
import type { FlashSaleDto, FlashSaleRequestDto } from '../types/discount';

export async function createFlashSale(request: FlashSaleRequestDto): Promise<FlashSaleDto> {
  const res = await api.post<FlashSaleDto>('/flash-sales', request);
  return res.data;
}

export async function getFlashSales(): Promise<FlashSaleDto[]> {
  const res = await api.get<FlashSaleDto[]>('/flash-sales');
  return res.data ?? [];
}

export async function getFlashSaleById(id: number): Promise<FlashSaleDto> {
  const res = await api.get<FlashSaleDto>(`/flash-sales/${id}`);
  if (!res.data) {
    throw new Error('Flash sale not found');
  }
  return res.data;
}

export async function getActiveFlashSales(): Promise<FlashSaleDto[]> {
  const res = await api.get<FlashSaleDto[]>('/flash-sales/active');
  return res.data ?? [];
}

export async function deleteFlashSale(id: number): Promise<void> {
  await api.delete(`/flash-sales/${id}`);
}
