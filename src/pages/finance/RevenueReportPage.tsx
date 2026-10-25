import { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Download, Percent } from 'lucide-react';
import { ChartCard, DashboardCard } from '../../components/ui';
import { useVendorPayouts } from '../../hooks/useVendorPayouts';
import { useRevenueReport } from '../../hooks/useRevenueReport';
import {
  categoryToChartData,
  categoryToPieData,
  chartPointsToSeries,
  defaultReportDateRange,
} from '../../utils/analyticsMappers';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { buildPayoutChartData, buildPayoutTimelineRows } from '../../utils/paymentHelpers';
import {
  VENDOR_PAYOUT_STATUS_LABELS,
  vendorPayoutStatusColor,
} from '../../utils/paymentLabels';

export function RevenueReportPage() {
  const defaultRange = defaultReportDateRange();
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const { payouts, summary } = useVendorPayouts();
  const { data: report, isLoading } = useRevenueReport(fromDate, toDate);

  const reportSummary = report?.summary;
  const dailyChartData = chartPointsToSeries(report?.chartData ?? []);
  const categoryChartData = categoryToChartData(report?.categoryData ?? []);
  const categoryPieData = categoryToPieData(report?.categoryData ?? []);
  const payoutChartData = buildPayoutChartData(payouts);
  const recentPayouts = buildPayoutTimelineRows(payouts, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Báo cáo doanh thu
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Doanh thu bán hàng từ analytics-service · lần rút tiền từ payment-service
          </p>
        </div>
        <button type="button" className="btn btn-secondary">
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label htmlFor="revenue-from" className="block text-sm text-gray-500 mb-1">
            Từ ngày
          </label>
          <input
            id="revenue-from"
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="revenue-to" className="block text-sm text-gray-500 mb-1">
            Đến ngày
          </label>
          <input
            id="revenue-to"
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DashboardCard
          title="Doanh thu gộp"
          value={formatCurrency(reportSummary?.totalRevenue ?? 0)}
          icon={<DollarSign className="w-6 h-6" />}
          growth={reportSummary?.growth}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Hoa hồng"
          value={formatCurrency(reportSummary?.commission ?? 0)}
          icon={<Percent className="w-6 h-6" />}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Doanh thu thuần"
          value={formatCurrency(reportSummary?.netRevenue ?? 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Tổng đơn hàng"
          value={reportSummary?.totalOrders ?? 0}
          icon={<ShoppingCart className="w-6 h-6" />}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Giá trị đơn TB"
          value={formatCurrency(reportSummary?.avgOrderValue ?? 0)}
          icon={<Calendar className="w-6 h-6" />}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Tổng đã rút"
          value={formatCurrency(summary.totalWithdrawn)}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Doanh thu theo ngày"
          subtitle={`Doanh thu gộp từ ${fromDate} đến ${toDate}`}
          type="area"
          data={dailyChartData}
          dataKeys={[{ key: 'revenue', name: 'Doanh thu', color: '#f43f5e' }]}
          isLoading={isLoading}
        />
        <ChartCard
          title="Lịch sử rút tiền"
          subtitle="Số tiền thực nhận từ các lần rút đã hoàn tất"
          type="line"
          data={payoutChartData as Record<string, unknown>[]}
          dataKeys={[{ key: 'amount', name: 'Thực nhận', color: '#22c55e' }]}
        />
      </div>

      {categoryChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Doanh thu theo danh mục"
              subtitle="Phân bổ theo danh mục trong khoảng thời gian đã chọn"
              type="bar"
              data={categoryChartData}
              dataKeys={[{ key: 'revenue', name: 'Doanh thu', color: '#f43f5e' }]}
              isLoading={isLoading}
            />
          </div>
          <ChartCard
            title="Tỷ trọng danh mục"
            type="pie"
            data={categoryPieData}
            dataKeys={[{ key: 'value', name: 'Tỷ lệ %', color: '#f43f5e' }]}
            isLoading={isLoading}
            height={250}
          />
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Đơn hàng</th>
              <th>Doanh thu</th>
              <th>Đơn TB</th>
            </tr>
          </thead>
          <tbody>
            {dailyChartData.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-6">
                  Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.
                </td>
              </tr>
            ) : (
              dailyChartData.map((row) => (
                <tr key={String(row.name)}>
                  <td>{String(row.name)}</td>
                  <td>{Number(row.orders ?? 0)}</td>
                  <td>{formatCurrency(Number(row.revenue ?? 0))}</td>
                  <td>
                    {formatCurrency(
                      Number(row.revenue ?? 0) / Math.max(Number(row.orders ?? 0), 1)
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Rút tiền gần đây</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentPayouts.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Chưa có lịch sử rút tiền.</p>
          ) : (
            recentPayouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {payout.payoutCode}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payout.createdAt ? formatDateTime(payout.createdAt) : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`badge badge-${vendorPayoutStatusColor(payout.status)}`}>
                    {VENDOR_PAYOUT_STATUS_LABELS[payout.status]}
                  </span>
                  <p className="text-sm font-medium text-success-600 mt-1">
                    {formatCurrency(payout.netAmount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
