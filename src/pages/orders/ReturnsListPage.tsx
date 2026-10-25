import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { EmptyState, LoadingSkeleton } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  type ReturnRequestDto,
  type ReturnRequestStatus,
} from '../../types/order';
import * as orderApi from '../../api/orderApi';

const FILTERS: { id: 'all' | ReturnRequestStatus; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'REQUESTED', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã đồng ý' },
  { id: 'SHIPPED', label: 'Khách đã gửi' },
  { id: 'DISPUTED', label: 'Khiếu nại' },
  { id: 'REFUNDED', label: 'Đã hoàn' },
];

export function ReturnsListPage() {
  const [status, setStatus] = useState<'all' | ReturnRequestStatus>('REQUESTED');
  const [items, setItems] = useState<ReturnRequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void orderApi
      .getVendorReturns({
        page: 1,
        size: 50,
        status: status === 'all' ? undefined : status,
      })
      .then((page) => {
        if (!cancelled) setItems(page.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <RotateCcw className="w-6 h-6" />
          Yêu cầu trả hàng
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Duyệt trong 48 giờ. Quá hạn hệ thống tự đồng ý. Hoàn tiền vào ví khi đối tác vận chuyển xác nhận hàng đã giao tới shop.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatus(filter.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              status === filter.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Không có yêu cầu trả hàng"
          description="Khi khách xin trả sau khi nhận hàng, yêu cầu sẽ hiện ở đây."
          variant="no-data"
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Đơn</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tạo lúc</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">#{row.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/orders/${row.subOrderId}`} className="text-primary-600 hover:underline">
                      {row.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{RETURN_REASON_LABELS[row.reason]}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(row.refundAmount))}</td>
                  <td className="px-4 py-3">{RETURN_STATUS_LABELS[row.status]}</td>
                  <td className="px-4 py-3">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
