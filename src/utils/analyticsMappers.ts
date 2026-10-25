import type {
  AnalyticsPeriod,
  CategoryBreakdownDto,
  ChartPointDto,
  SummaryStatsDto,
  TopProductDto,
} from '../types/analytics';
import { formatChartDateLabel } from './helpers';

export function toNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function mapSummaryStats(raw: Record<string, unknown> | null | undefined): SummaryStatsDto {
  return {
    totalRevenue: toNumber(raw?.totalRevenue),
    totalOrders: toNumber(raw?.totalOrders),
    growth: raw?.growth != null ? toNumber(raw.growth) : undefined,
    ordersGrowth: raw?.ordersGrowth != null ? toNumber(raw.ordersGrowth) : undefined,
    avgOrderValue: toNumber(raw?.avgOrderValue),
    avgOrderValueGrowth:
      raw?.avgOrderValueGrowth != null ? toNumber(raw.avgOrderValueGrowth) : undefined,
    totalCustomers: raw?.totalCustomers != null ? toNumber(raw.totalCustomers) : null,
    newCustomers: raw?.newCustomers != null ? toNumber(raw.newCustomers) : null,
    commission: raw?.commission != null ? toNumber(raw.commission) : null,
    netRevenue: raw?.netRevenue != null ? toNumber(raw.netRevenue) : null,
  };
}

export function mapChartPoint(raw: Record<string, unknown>): ChartPointDto {
  return {
    date: typeof raw.date === 'string' ? raw.date : null,
    name: typeof raw.name === 'string' ? raw.name : null,
    revenue: toNumber(raw.revenue),
    orders: toNumber(raw.orders),
    value: raw.value != null ? toNumber(raw.value) : null,
  };
}

export function mapTopProduct(raw: Record<string, unknown>): TopProductDto {
  return {
    productId: toNumber(raw.productId),
    name: typeof raw.name === 'string' ? raw.name : 'Unknown product',
    quantity: toNumber(raw.quantity),
    sales: toNumber(raw.sales),
    revenue: toNumber(raw.revenue),
    stock: raw.stock != null ? toNumber(raw.stock) : null,
    rating: raw.rating != null ? toNumber(raw.rating) : null,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : null,
    categoryName: typeof raw.categoryName === 'string' ? raw.categoryName : null,
  };
}

export function mapCategoryBreakdown(raw: Record<string, unknown>): CategoryBreakdownDto {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Other',
    revenue: toNumber(raw.revenue),
    quantitySold: toNumber(raw.quantitySold),
    value: toNumber(raw.value),
  };
}

export function chartPointsToSeries(points: ChartPointDto[]): Record<string, unknown>[] {
  return points.map((point) => ({
    name: point.date ?? point.name ?? '—',
    revenue: point.revenue,
    orders: point.orders,
  }));
}

/** Keep only points whose date falls inside the selected filter window. */
export function filterPointsToBounds(
  points: ChartPointDto[],
  from: string | null,
  to: string | null
): ChartPointDto[] {
  if (!from || !to) return points;
  return points.filter((point) => {
    const key = normalizeDayKey(point.date) ?? normalizeDayKey(point.name);
    if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    return key >= from && key <= to;
  });
}

export function chartSeriesTotals(series: Record<string, unknown>[]): {
  revenue: number;
  orders: number;
  avgOrderValue: number;
} {
  const revenue = series.reduce((sum, point) => sum + toNumber(point.revenue), 0);
  const orders = series.reduce((sum, point) => sum + toNumber(point.orders), 0);
  return {
    revenue,
    orders,
    avgOrderValue: orders > 0 ? revenue / orders : 0,
  };
}

/** Use API growth only when its totals match the series already clipped to the selected period. */
export function growthIfTotalsMatch(
  totals: { revenue: number; orders: number },
  summary?: SummaryStatsDto | null
): Pick<SummaryStatsDto, 'growth' | 'ordersGrowth' | 'avgOrderValueGrowth'> {
  if (
    summary &&
    Math.abs(summary.totalRevenue - totals.revenue) < 0.5 &&
    Math.abs(summary.totalOrders - totals.orders) < 0.5
  ) {
    return {
      growth: summary.growth,
      ordersGrowth: summary.ordersGrowth,
      avgOrderValueGrowth: summary.avgOrderValueGrowth,
    };
  }
  return {};
}

/** Fill every day in the selected window so area charts stay continuous. */
export function fillDailyChartSeries(
  points: ChartPointDto[],
  from: string | null,
  to: string | null
): Record<string, unknown>[] {
  if (!from || !to) {
    return chartPointsToSeries(points);
  }

  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (start.getTime() > end.getTime()) {
    return chartPointsToSeries(points);
  }

  const dayCount = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (dayCount > 90) {
    return chartPointsToSeries(points);
  }

  const byDate = new Map<string, ChartPointDto>();
  for (const point of points) {
    const key = normalizeDayKey(point.date) ?? normalizeDayKey(point.name);
    if (key) byDate.set(key, point);
  }

  const series: Record<string, unknown>[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = formatIsoDate(cursor);
    const existing = byDate.get(iso);
    series.push({
      name: iso,
      revenue: existing?.revenue ?? 0,
      orders: existing?.orders ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

/** Scale trend charts to the selected period: days for week/month, months for year/all. */
export function chartSeriesForPeriod(
  period: AnalyticsPeriod | undefined,
  dailyPoints: ChartPointDto[],
  aggregatedPoints: ChartPointDto[],
  from: string | null,
  to: string | null
): Record<string, unknown>[] {
  if (period === 'YEAR' || period === 'ALL') {
    if (aggregatedPoints.length > 0) {
      return aggregatedPoints.map((point) => ({
        name: point.name ?? point.date ?? '—',
        revenue: point.revenue,
        orders: point.orders,
      }));
    }
    return chartPointsToSeries(dailyPoints);
  }
  return fillDailyChartSeries(dailyPoints, from, to);
}

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function normalizeDayKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : value;
}

export function categoryToChartData(categories: CategoryBreakdownDto[]): Record<string, unknown>[] {
  return categories.map((cat) => ({
    name: cat.name,
    revenue: cat.revenue,
    sales: cat.quantitySold,
    value: cat.value,
  }));
}

export function topProductsToChartData(products: TopProductDto[]): Record<string, unknown>[] {
  return products.map((product) => ({
    name: product.name,
    revenue: product.revenue,
    sales: product.quantity || product.sales,
  }));
}

export function categoryToPieData(categories: CategoryBreakdownDto[]): Record<string, unknown>[] {
  return categories.map((cat) => ({
    name: cat.name,
    value: cat.value,
  }));
}

export function topSalesDaysFromChart(
  points: ChartPointDto[],
  limit = 7
): { name: string; revenue: number }[] {
  return [...points]
    .filter((point) => point.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((point) => ({
      name: formatChartDateLabel(point.name ?? point.date ?? '—'),
      revenue: point.revenue,
    }));
}

export function customerGrowthToSeries(points: ChartPointDto[]): Record<string, unknown>[] {
  return points.map((point) => ({
    name: point.name ?? point.date ?? '—',
    customers: point.value ?? 0,
    newCustomers: point.orders ?? 0,
  }));
}

export const CUSTOMER_SEGMENT_LEGEND = [
  { name: 'Mới', color: '#22c55e' },
  { name: 'Thường xuyên', color: '#0ea5e9' },
  { name: 'VIP', color: '#f59e0b' },
  { name: 'Không hoạt động', color: '#94a3b8' },
] as const;

export function segmentsToPieData(segments: {
  newCustomers: number;
  regular: number;
  vip: number;
  inactive: number;
}): Record<string, unknown>[] {
  return [
    { name: 'Mới', value: segments.newCustomers, color: CUSTOMER_SEGMENT_LEGEND[0].color },
    { name: 'Thường xuyên', value: segments.regular, color: CUSTOMER_SEGMENT_LEGEND[1].color },
    { name: 'VIP', value: segments.vip, color: CUSTOMER_SEGMENT_LEGEND[2].color },
    { name: 'Không hoạt động', value: segments.inactive, color: CUSTOMER_SEGMENT_LEGEND[3].color },
  ].filter((item) => item.value > 0);
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function defaultReportDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: formatIsoDate(from), to: formatIsoDate(to) };
}
