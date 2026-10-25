import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { DashboardCard, ChartCard, EmptyState } from '../../components/ui';
import { OrderStatsPeriodBar } from '../../components/orders/OrderStatsPeriodBar';
import { useVendorPayouts } from '../../hooks/useVendorPayouts';
import { useVendorOrders } from '../../hooks/useVendorOrders';
import { useVendorDashboard } from '../../hooks/useVendorDashboard';
import { useSalesAnalytics } from '../../hooks/useSalesAnalytics';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { getVendorProducts } from '../../api/productApi';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { chartSeriesForPeriod, chartSeriesTotals, filterPointsToBounds } from '../../utils/analyticsMappers';
import { buildPayoutChartData } from '../../utils/paymentHelpers';
import { periodBounds } from '../../utils/orderStatsPeriod';
import {
  SUB_ORDER_STATUS_LABELS,
  subOrderStatusColor,
} from '../../types/order';
import type { ProductCardModel } from '../../types/product';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';

export function DashboardPage() {
  const navigate = useNavigate();
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const periodQuery = { period, anchor };
  const bounds = periodBounds(period, anchor);
  const { summary, payouts } = useVendorPayouts();
  const { data: dashboard } = useVendorDashboard(periodQuery);
  const { data: salesAnalytics, isLoading: salesLoading } = useSalesAnalytics(periodQuery);
  const { result: recentSubOrdersResult, isLoading: ordersLoading } = useVendorOrders({
    page: 1,
    size: 5,
  });
  const { result: pendingMeta } = useVendorOrders({
    page: 1,
    size: 1,
    status: 'CREATED',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<ProductCardModel[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProductSummary() {
      try {
        const result = await getVendorProducts({ page: 1, size: 200 });
        if (cancelled) return;
        setVendorProducts(result.data.filter((p) => !p.deleted));
        setProductCount(result.total);
      } catch {
        if (!cancelled) {
          setVendorProducts([]);
          setProductCount(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProductSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockProducts = vendorProducts.filter((p) => p.stock <= 10);
  const recentOrders = recentSubOrdersResult?.data ?? [];
  const pendingOrders = pendingMeta?.total ?? 0;
  const topProducts = [...vendorProducts]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const revenueChartData = chartSeriesForPeriod(
    period,
    filterPointsToBounds(salesAnalytics?.chartData ?? [], bounds.from, bounds.to),
    filterPointsToBounds(salesAnalytics?.weeklyData ?? [], bounds.from, bounds.to),
    bounds.from,
    bounds.to
  );
  const salesTotals = chartSeriesTotals(revenueChartData);
  const payoutChartData = buildPayoutChartData(payouts);

  const statsLoading = salesLoading;
  const balanceLabel =
    summary.availableBalance != null && summary.availableBalance > 0
      ? `${formatCurrency(summary.availableBalance)} khả dụng`
      : summary.hasActivePayout && summary.activePayout
        ? `${formatCurrency(summary.activePayout.grossAmount)} đang chờ`
        : summary.totalWithdrawn > 0
          ? `${formatCurrency(summary.totalWithdrawn)} đã rút`
          : 'Chưa có khoản rút nào';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bảng điều khiển</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Chào mừng trở lại! Đây là tình hình cửa hàng của bạn.
          </p>
        </div>
        <div className="px-3 py-2 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-sm">
          <span className="font-medium">{balanceLabel}</span>
        </div>
      </div>

      <OrderStatsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <DashboardCard
          title="Tổng doanh thu"
          value={formatCurrency(salesTotals.revenue)}
          icon={<DollarSign className="w-6 h-6" />}
          comparison={periodLabel}
          isLoading={statsLoading}
        />
        <DashboardCard
          title="Tổng đơn hàng"
          value={salesTotals.orders}
          icon={<ShoppingCart className="w-6 h-6" />}
          comparison={periodLabel}
          isLoading={statsLoading}
        />
        <DashboardCard
          title="Giá trị đơn hàng trung bình"
          value={formatCurrency(salesTotals.avgOrderValue)}
          icon={<TrendingUp className="w-6 h-6" />}
          comparison={periodLabel}
          isLoading={statsLoading}
        />
        <DashboardCard
          title="Sản phẩm"
          value={productCount}
          icon={<Package className="w-6 h-6" />}
          isLoading={isLoading}
        />
        <DashboardCard
          title="Đã rút"
          value={formatCurrency(summary.totalWithdrawn)}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {dashboard?.topProduct && (
        <div
          className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-primary-500"
          onClick={() => navigate(`/products/${dashboard.topProduct!.productId}`)}
        >
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">Bán chạy nhất ({periodLabel})</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {dashboard.topProduct.name}
            </p>
            <p className="text-sm text-gray-500">
              {dashboard.topProduct.quantity} đã bán · {formatCurrency(dashboard.topProduct.revenue)}
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-400 shrink-0" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pendingOrders > 0 && (
          <div
            onClick={() => navigate('/orders/list?status=pending')}
            className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-warning-500"
          >
            <div className="p-3 rounded-lg bg-warning-100 dark:bg-warning-900/30">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {pendingOrders} đơn hàng mới
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Đơn con đang chờ xác nhận sản phẩm
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div
            onClick={() => navigate('/inventory')}
            className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-error-500"
          >
            <div className="p-3 rounded-lg bg-error-100 dark:bg-error-900/30">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {lowStockProducts.length} sản phẩm sắp hết hàng
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sản phẩm có tồn kho thấp
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Xu hướng doanh thu"
          subtitle={`Doanh thu (${periodLabel})`}
          type="area"
          data={revenueChartData}
          dataKeys={[{ key: 'revenue', name: 'Doanh thu', color: '#f43f5e' }]}
          isLoading={statsLoading}
        />
        <ChartCard
          title="Xu hướng đơn hàng"
          subtitle={`Số đơn hàng (${periodLabel})`}
          type="area"
          data={revenueChartData}
          dataKeys={[{ key: 'orders', name: 'Đơn hàng', color: '#0ea5e9' }]}
          isLoading={statsLoading}
        />
      </div>

      <ChartCard
        title="Lịch sử rút tiền"
        subtitle="Số tiền rút ròng theo tháng"
        type="line"
        data={payoutChartData as Record<string, unknown>[]}
        dataKeys={[{ key: 'amount', name: 'Đã rút ròng', color: '#22c55e' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Đơn hàng gần đây
            </h3>
            <button
              onClick={() => navigate('/orders/list')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {order.orderCode ?? `#${order.id}`}
                  </span>
                  <span className={`badge badge-${subOrderStatusColor(order.status)}`}>
                    {SUB_ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {order.customerName ?? 'Khách hàng'}
                    {order.createdAt ? ` · ${formatDateTime(order.createdAt)}` : ''}
                  </span>
                  <span className="font-medium text-primary-600">
                    {formatCurrency(Number(order.finalAmount))}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && !ordersLoading && (
              <div className="p-8">
                <EmptyState
                  title="Không có đơn hàng gần đây"
                  description="Đơn hàng sẽ hiển thị ở đây khi khách hàng bắt đầu mua hàng"
                  variant="no-data"
                />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sản phẩm đánh giá cao
            </h3>
            <button
              onClick={() => navigate('/products')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Xem tất cả
            </button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topProducts.map((product, index) => (
              <div
                key={product.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                  {index + 1}
                </div>
                <img
                  src={product.thumbnail || PRODUCT_PLACEHOLDER}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tồn kho: {product.stock}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary-600">★ {product.rating.toFixed(1)}</p>
                  <div className="flex items-center gap-1 text-success-600 text-sm justify-end">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && !isLoading && (
              <div className="p-8">
                <EmptyState
                  title="Chưa có sản phẩm"
                  description="Thêm sản phẩm để xem tại đây"
                  variant="no-data"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
