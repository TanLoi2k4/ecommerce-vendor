import { useMemo, useState } from 'react';
import { ChartCard, EmptyState } from '../../components/ui';
import { OrderStatsPeriodBar } from '../../components/orders/OrderStatsPeriodBar';
import { useVendorOrderStats } from '../../hooks/useVendorOrders';
import type { OrderStatsPeriod, SubOrderStatus } from '../../types/order';
import { todayAnchor } from '../../utils/orderStatsPeriod';

const STATUS_ROWS: { name: string; status: SubOrderStatus }[] = [
  { name: 'Chờ xử lý', status: 'CREATED' },
  { name: 'Đang xử lý', status: 'PROCESSING' },
  { name: 'Yêu cầu giao', status: 'SHIPPING_REQUESTED' },
  { name: 'Đang giao', status: 'SHIPPING' },
  { name: 'Hoàn thành', status: 'COMPLETED' },
  { name: 'Đã trả hàng', status: 'RETURNED' },
  { name: 'Đã hủy', status: 'CANCELLED' },
];

function countOf(
  byStatus: Partial<Record<SubOrderStatus, number>> | undefined,
  status: SubOrderStatus
): number {
  return byStatus?.[status] ?? 0;
}

export function OrdersDashboardPage() {
  const [period, setPeriod] = useState<OrderStatsPeriod>('MONTH');
  const [anchor, setAnchor] = useState(todayAnchor);
  const { stats, isLoading } = useVendorOrderStats({ period, anchor });

  const orderStatusData = useMemo(() => {
    if (!stats) return [];
    return STATUS_ROWS.map((row) => ({
      name: row.name,
      count: countOf(stats.byStatus, row.status),
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bảng điều khiển đơn hàng
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Thống kê đơn phụ theo tuần, tháng, năm
        </p>
      </div>

      <OrderStatsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={stats?.period?.label}
        onPeriodChange={(next) => {
          setPeriod(next);
          setAnchor(todayAnchor());
        }}
        onAnchorChange={setAnchor}
      />

      {isLoading && (
        <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      )}

      {!isLoading && !stats && (
        <EmptyState
          title="Không thể tải thống kê đơn hàng"
          description="Hãy thử tải lại trang. Nếu lỗi vẫn tiếp diễn, kiểm tra kết nối tới order-service."
          variant="error"
        />
      )}

      {!isLoading && stats && (
        <ChartCard
          title="Đơn hàng theo trạng thái"
          subtitle={stats.period?.label}
          type="bar"
          data={orderStatusData}
          dataKeys={[
            {
              key: 'count',
              name: stats.period?.label ?? 'Số đơn',
              color: '#3b82f6',
            },
          ]}
          showLegend={false}
        />
      )}
    </div>
  );
}
