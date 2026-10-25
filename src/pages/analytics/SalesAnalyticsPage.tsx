import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { DashboardCard, ChartCard, LoadingSkeleton } from '../../components/ui';
import { OrderStatsPeriodBar } from '../../components/orders/OrderStatsPeriodBar';
import { formatCurrency } from '../../utils/helpers';
import { useSalesAnalytics } from '../../hooks/useSalesAnalytics';
import { useProductsByCategory } from '../../hooks/useProductsByCategory';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import {
  categoryToChartData,
  categoryToPieData,
  chartSeriesForPeriod,
  chartSeriesTotals,
  filterPointsToBounds,
  growthIfTotalsMatch,
  topSalesDaysFromChart,
} from '../../utils/analyticsMappers';
import { formatGrowthLabel, periodBounds } from '../../utils/orderStatsPeriod';

export function SalesAnalyticsPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const periodQuery = { period, anchor };
  const bounds = periodBounds(period, anchor);
  const { data: sales, isLoading: salesLoading } = useSalesAnalytics(periodQuery);
  const { data: categories, isLoading: categoriesLoading } = useProductsByCategory(periodQuery);

  const isLoading = salesLoading;
  const boundedChartData = filterPointsToBounds(sales?.chartData ?? [], bounds.from, bounds.to);
  const trendChartData = chartSeriesForPeriod(
    period,
    boundedChartData,
    filterPointsToBounds(sales?.weeklyData ?? [], bounds.from, bounds.to),
    bounds.from,
    bounds.to
  );
  const totals = chartSeriesTotals(trendChartData);
  const growth = growthIfTotalsMatch(totals, sales?.summary);
  const categoryChartData = categoryToChartData(categories);
  const categoryPieData = categoryToPieData(categories);
  const topSellingDays = topSalesDaysFromChart(boundedChartData, 7);

  if (isLoading && !sales) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Phân tích doanh số
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi hiệu suất và xu hướng bán hàng
          </p>
        </div>
        <OrderStatsPeriodBar
          period={period}
          anchor={anchor}
          periodLabel={periodLabel}
          onPeriodChange={onPeriodChange}
          onAnchorChange={onAnchorChange}
        />
        <LoadingSkeleton variant="dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Phân tích doanh số
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi hiệu suất và xu hướng bán hàng
        </p>
      </div>

      <OrderStatsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Tổng doanh thu"
          value={formatCurrency(totals.revenue)}
          icon={<DollarSign className="w-6 h-6" />}
          growth={period === 'ALL' ? undefined : growth.growth}
          growthLabel={formatGrowthLabel(period)}
          comparison={periodLabel}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Tổng đơn hàng"
          value={totals.orders}
          icon={<ShoppingCart className="w-6 h-6" />}
          growth={period === 'ALL' ? undefined : growth.ordersGrowth}
          growthLabel={formatGrowthLabel(period)}
          comparison={periodLabel}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Giá trị đơn TB"
          value={formatCurrency(totals.avgOrderValue)}
          icon={<TrendingUp className="w-6 h-6" />}
          growth={period === 'ALL' ? undefined : growth.avgOrderValueGrowth}
          growthLabel={formatGrowthLabel(period)}
          comparison={periodLabel}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Xu hướng doanh thu"
          subtitle={`Doanh thu (${periodLabel})`}
          type="area"
          data={trendChartData}
          dataKeys={[{ key: 'revenue', name: 'Doanh thu', color: '#f43f5e' }]}
          isLoading={isLoading}
        />
        <ChartCard
          title="Xu hướng đơn hàng"
          subtitle={`Đơn hàng (${periodLabel})`}
          type="area"
          data={trendChartData}
          dataKeys={[{ key: 'orders', name: 'Đơn hàng', color: '#0ea5e9' }]}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Bán hàng theo danh mục"
            subtitle={`Số lượng bán theo danh mục (${periodLabel})`}
            type="bar"
            data={categoryChartData}
            dataKeys={[{ key: 'sales', name: 'Đã bán', color: '#f43f5e' }]}
            isLoading={categoriesLoading}
          />
        </div>
        <div>
          <ChartCard
            title="Phân bổ danh mục"
            type="pie"
            data={categoryPieData}
            dataKeys={[{ key: 'value', name: 'Tỷ lệ %', color: '#f43f5e' }]}
            isLoading={categoriesLoading}
            height={250}
          />
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ngày bán hàng cao nhất
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {topSellingDays.map((day) => (
            <div key={day.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary-600" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {day.name}
                </span>
              </div>
              <span className="font-semibold text-primary-600">
                {formatCurrency(day.revenue)}
              </span>
            </div>
          ))}
          {topSellingDays.length === 0 && (
            <p className="p-8 text-center text-gray-500">Không có dữ liệu bán hàng trong kỳ này</p>
          )}
        </div>
      </div>
    </div>
  );
}
