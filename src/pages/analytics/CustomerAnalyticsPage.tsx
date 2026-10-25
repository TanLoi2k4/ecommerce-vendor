import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, DollarSign } from 'lucide-react';
import { ChartCard, DashboardCard, LoadingSkeleton } from '../../components/ui';
import { useCustomerSummary } from '../../hooks/useCustomerSummary';
import { useTopCustomers } from '../../hooks/useTopCustomers';
import { useCustomerGrowth } from '../../hooks/useCustomerGrowth';
import { useCustomerSegments } from '../../hooks/useCustomerSegments';
import {
  CUSTOMER_SEGMENT_LEGEND,
  customerGrowthToSeries,
  segmentsToPieData,
} from '../../utils/analyticsMappers';
import { formatCurrency } from '../../utils/helpers';

export function CustomerAnalyticsPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = useCustomerSummary();
  const { data: topCustomers, isLoading: topLoading } = useTopCustomers(5);
  const { data: growth, isLoading: growthLoading } = useCustomerGrowth();
  const { data: segments, isLoading: segmentsLoading } = useCustomerSegments();

  const totalCustomers = summary?.totalCustomers ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const avgOrdersPerCustomer = totalOrders / Math.max(totalCustomers, 1);
  const avgCustomerValue = (summary?.totalRevenue ?? 0) / Math.max(totalCustomers, 1);

  const customerGrowthData = customerGrowthToSeries(growth?.chartData ?? []);
  const segmentPieData = segments ? segmentsToPieData(segments) : [];

  const isLoading = summaryLoading && !summary;

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Phân tích khách hàng
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Tổng khách hàng"
          value={totalCustomers}
          icon={<Users className="w-6 h-6" />}
          isLoading={summaryLoading}
        />
        <DashboardCard
          title="Đơn TB/khách"
          value={avgOrdersPerCustomer.toFixed(1)}
          icon={<UserPlus className="w-6 h-6" />}
          isLoading={summaryLoading}
        />
        <DashboardCard
          title="Giá trị TB/khách"
          value={formatCurrency(avgCustomerValue)}
          icon={<DollarSign className="w-6 h-6" />}
          isLoading={summaryLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Tăng trưởng khách hàng"
          subtitle="Khách hàng mới tích lũy (30 ngày gần nhất)"
          type="area"
          data={customerGrowthData}
          dataKeys={[{ key: 'customers', name: 'Khách hàng', color: '#f43f5e' }]}
          isLoading={growthLoading}
        />
        {segmentPieData.length > 0 ? (
          <ChartCard
            title="Phân khúc khách hàng"
            subtitle={
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {CUSTOMER_SEGMENT_LEGEND.map((item) => (
                  <span key={item.name} className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </span>
                ))}
              </span>
            }
            type="pie"
            data={segmentPieData}
            dataKeys={[{ key: 'value', name: 'Khách hàng', color: '#0ea5e9' }]}
            isLoading={segmentsLoading}
            height={250}
          />
        ) : (
          <div className="card p-6 flex items-center justify-center text-gray-500">
            Chưa có dữ liệu phân khúc
          </div>
        )}
      </div>

      {summary?.newCustomers != null && (
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Khách hàng mới (30 ngày)</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {summary.newCustomers}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Doanh thu khách hàng tích lũy: {formatCurrency(summary.totalRevenue ?? 0)}
          </p>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Khách hàng hàng đầu
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {topLoading && topCustomers.length === 0 && (
            <p className="p-8 text-center text-gray-500">Đang tải khách hàng hàng đầu…</p>
          )}
          {topCustomers.map((customer, i) => (
            <div
              key={customer.customerKeycloakId}
              className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() =>
                navigate(`/customers/${encodeURIComponent(customer.customerKeycloakId)}`)
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {customer.orders} đơn hàng
                    {customer.phone ? ` · ${customer.phone}` : ''}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-primary-600">
                {formatCurrency(customer.spent)}
              </span>
            </div>
          ))}
          {!topLoading && topCustomers.length === 0 && (
            <p className="p-8 text-center text-gray-500">Chưa có dữ liệu khách hàng</p>
          )}
        </div>
      </div>
    </div>
  );
}
