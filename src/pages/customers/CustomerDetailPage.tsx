import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  ShoppingCart,
  Calendar,
  DollarSign,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useVendorCustomerDetail } from '../../hooks/useVendorCustomerDetail';
import { useVendorOrders } from '../../hooks/useVendorOrders';
import { useAuthStore } from '../../store/authStore';
import * as chatApi from '../../api/chatApi';
import { LoadingSkeleton, EmptyState, toast } from '../../components/ui';
import { formatCurrency, formatDateTime, getInitials } from '../../utils/helpers';
import {
  SUB_ORDER_STATUS_LABELS,
  subOrderStatusColor,
} from '../../types/order';

const SEGMENT_LABELS: Record<string, string> = {
  NEW: 'Khách hàng mới',
  RETURNING: 'Khách hàng thường xuyên',
  VIP: 'Khách hàng VIP',
  INACTIVE: 'Khách hàng không hoạt động',
};

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendor = useAuthStore((s) => s.vendor);
  const customerKeycloakId = id ? decodeURIComponent(id) : null;
  const [openingChat, setOpeningChat] = useState(false);

  const {
    customer,
    isLoading: customerLoading,
    error: customerError,
  } = useVendorCustomerDetail(customerKeycloakId);
  const {
    result: ordersResult,
    isLoading: ordersLoading,
    error: ordersError,
  } = useVendorOrders({
    customerKeycloakId: customerKeycloakId ?? undefined,
    page: 1,
    size: 50,
    enabled: Boolean(customerKeycloakId),
  });

  const customerOrders = ordersResult?.data ?? [];
  const loading = customerLoading || (ordersLoading && customerOrders.length === 0);

  const handleOpenChat = async () => {
    const buyerId = customer?.customerKeycloakId ?? customerKeycloakId;
    const vendorId = vendor?.keycloakId;
    if (!buyerId || !vendorId) {
      toast.error('Thiếu thông tin để mở chat với khách hàng');
      return;
    }
    setOpeningChat(true);
    try {
      const room = await chatApi.createRoom({ vendorId, buyerId });
      navigate(`/chat?room=${encodeURIComponent(room.roomCode)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không mở được chat');
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (customerError || !customer) {
    return (
      <EmptyState
        title="Không tìm thấy khách hàng"
        description={customerError ?? 'Không tìm thấy khách hàng này trong phân tích cửa hàng của bạn.'}
        variant="no-data"
        action={
          <button type="button" onClick={() => navigate('/customers')} className="btn btn-primary">
            Quay lại danh sách khách hàng
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 text-xl font-bold shrink-0">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {customer.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {customer.firstOrderAt
                ? `Đơn đầu tiên ${formatDateTime(customer.firstOrderAt)}`
                : 'Hồ sơ khách hàng'}
              {customer.segment
                ? ` · ${SEGMENT_LABELS[customer.segment] ?? customer.segment}`
                : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleOpenChat()}
          disabled={openingChat}
          className="btn btn-primary shrink-0"
        >
          {openingChat ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
          Nhắn tin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Lịch sử đơn con
              </h3>
            </div>
            {ordersError && (
              <div className="p-4 text-sm text-error-600">{ordersError}</div>
            )}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {customerOrders.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="Chưa có đơn hàng"
                    description="Không tìm thấy đơn con nào của khách hàng này"
                    variant="no-data"
                  />
                </div>
              ) : (
                customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {order.orderCode ?? `Đơn con #${order.id}`}
                      </span>
                      <span className={`badge badge-${subOrderStatusColor(order.status)}`}>
                        {SUB_ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {order.createdAt ? formatDateTime(order.createdAt) : '—'}
                      </span>
                      <span className="font-semibold text-primary-600">
                        {formatCurrency(Number(order.finalAmount))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Liên hệ
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {customer.phone ?? '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleOpenChat()}
                disabled={openingChat}
                className="btn btn-primary w-full"
              >
                {openingChat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Nhắn tin với khách hàng
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Thống kê khách hàng
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <ShoppingCart className="w-5 h-5" />
                  Tổng đơn hàng
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {customer.totalOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <DollarSign className="w-5 h-5" />
                  Tổng chi tiêu
                </div>
                <span className="font-semibold text-primary-600">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <DollarSign className="w-5 h-5" />
                  Giá trị đơn TB
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(customer.totalSpent / Math.max(customer.totalOrders, 1))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-5 h-5" />
                  Đơn gần nhất
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : 'Không có'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
