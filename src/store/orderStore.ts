import { create } from 'zustand';
import * as orderApi from '../api/orderApi';
import type { VendorSubOrderListParams } from '../api/orderApi';
import type { SubOrderDetail, SubOrderListResult } from '../types/order';
import { getOrderErrorMessage } from '../utils/orderErrors';

interface OrderState {
  isLoading: boolean;
  error: string | null;
  lastListResult: SubOrderListResult | null;
  fetchSubOrders: (params?: VendorSubOrderListParams) => Promise<SubOrderListResult>;
  fetchSubOrderDetail: (id: number) => Promise<SubOrderDetail>;
}

export const useOrderStore = create<OrderState>((set) => ({
  isLoading: false,
  error: null,
  lastListResult: null,

  fetchSubOrders: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await orderApi.getVendorSubOrders(params);
      set({ isLoading: false, lastListResult: result, error: null });
      return result;
    } catch (err) {
      const message = getOrderErrorMessage(err, 'Không thể tải danh sách đơn hàng');
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  fetchSubOrderDetail: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const detail = await orderApi.getVendorSubOrderById(id);
      set({ isLoading: false, error: null });
      return detail;
    } catch (err) {
      const message = getOrderErrorMessage(err, 'Không thể tải chi tiết đơn hàng');
      set({ isLoading: false, error: message });
      throw err;
    }
  },
}));
