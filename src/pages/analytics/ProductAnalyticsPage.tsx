import { useState, useEffect } from 'react';
import { Package, TrendingUp, ShoppingCart, Star } from 'lucide-react';
import { ChartCard, LoadingSkeleton } from '../../components/ui';
import { OrderStatsPeriodBar } from '../../components/orders/OrderStatsPeriodBar';
import { getVendorProducts } from '../../api/productApi';
import { useTopProducts } from '../../hooks/useTopProducts';
import { useStatsPeriodFilter } from '../../hooks/useStatsPeriodFilter';
import { topProductsToChartData } from '../../utils/analyticsMappers';
import { formatCurrency } from '../../utils/helpers';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';
import type { ProductCardModel } from '../../types/product';

export function ProductAnalyticsPage() {
  const { period, anchor, periodLabel, onPeriodChange, onAnchorChange } = useStatsPeriodFilter();
  const [products, setProducts] = useState<ProductCardModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const { data: topProducts, isLoading: topLoading } = useTopProducts(8, true, { period, anchor });

  useEffect(() => {
    getVendorProducts({ page: 1, size: 200 })
      .then((result) => setProducts(result.data.filter((p) => !p.deleted)))
      .catch(() => setProducts([]))
      .finally(() => setCatalogLoading(false));
  }, []);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const ratedProducts = products.filter((p) => p.rating > 0);
  const avgRating =
    ratedProducts.length > 0
      ? ratedProducts.reduce((sum, p) => sum + p.rating, 0) / ratedProducts.length
      : 0;

  const chartData = topProductsToChartData(topProducts);
  const bestSellers = topProducts.slice(0, 5);
  const isLoading = catalogLoading;

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Phân tích sản phẩm
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi hiệu suất và doanh thu theo sản phẩm
          </p>
        </div>
        <OrderStatsPeriodBar
          period={period}
          anchor={anchor}
          periodLabel={periodLabel}
          onPeriodChange={onPeriodChange}
          onAnchorChange={onAnchorChange}
        />
        <LoadingSkeleton variant="stats" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Phân tích sản phẩm
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi hiệu suất và doanh thu theo sản phẩm
        </p>
      </div>

      <OrderStatsPeriodBar
        period={period}
        anchor={anchor}
        periodLabel={periodLabel}
        onPeriodChange={onPeriodChange}
        onAnchorChange={onAnchorChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng sản phẩm</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <Package className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng tồn kho</p>
              <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-success-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đánh giá TB</p>
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
            </div>
            <Star className="w-6 h-6 text-warning-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sắp hết hàng (≤10)</p>
              <p className="text-2xl font-bold">
                {products.filter((p) => p.stock <= 10).length}
              </p>
            </div>
            <ShoppingCart className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="Hiệu suất theo sản phẩm"
          subtitle={`Số lượng đã bán theo từng sản phẩm (${periodLabel})`}
          type="bar"
          data={chartData}
          dataKeys={[{ key: 'sales', name: 'Đã bán', color: '#f43f5e' }]}
          colorByItem
          showLegend={false}
          isLoading={topLoading}
        />
        <ChartCard
          title="Doanh thu theo sản phẩm"
          subtitle={`Doanh thu theo từng sản phẩm (${periodLabel})`}
          type="bar"
          data={chartData}
          dataKeys={[{ key: 'revenue', name: 'Doanh thu', color: '#22c55e' }]}
          colorByItem
          showLegend={false}
          isLoading={topLoading}
        />
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Sản phẩm bán chạy nhất</h3>
          <p className="text-sm text-gray-500 mt-1">{periodLabel}</p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {topLoading && bestSellers.length === 0 && (
            <p className="p-8 text-center text-gray-500">Đang tải sản phẩm hàng đầu…</p>
          )}
          {bestSellers.map((product, i) => (
            <div key={product.productId} className="p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                {i + 1}
              </div>
              <img
                src={product.imageUrl || PRODUCT_PLACEHOLDER}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {product.categoryName ?? '—'}
                  {product.rating != null ? ` · ★ ${product.rating.toFixed(1)}` : ''}
                  {product.stock != null ? ` · Tồn kho: ${product.stock}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-600">{formatCurrency(product.revenue)}</p>
                <p className="text-sm text-gray-500">Đã bán {product.quantity}</p>
              </div>
            </div>
          ))}
          {!topLoading && bestSellers.length === 0 && (
            <p className="p-8 text-center text-gray-500">Chưa có dữ liệu bán hàng trong kỳ này</p>
          )}
        </div>
      </div>
    </div>
  );
}
