import api from './client';
import type {
  AnalyticsPeriodQuery,
  CategoryBreakdownDto,
  CustomerGrowthResponse,
  CustomerSegmentsDto,
  RevenueReportResponse,
  SalesAnalyticsResponse,
  SummaryStatsDto,
  TopCustomerDto,
  TopProductDto,
  VendorDashboardResponse,
} from '../types/analytics';
import type {
  VendorCustomer,
  VendorCustomerListParams,
  VendorCustomerPage,
  CustomerSegment,
} from '../types/customer';
import {
  mapCategoryBreakdown,
  mapChartPoint,
  mapSummaryStats,
  mapTopProduct,
  toNumber,
} from '../utils/analyticsMappers';
import { toPeriodParams, todayAnchor } from '../utils/orderStatsPeriod';

function periodParams(query: AnalyticsPeriodQuery = {}) {
  return toPeriodParams(query.period ?? 'MONTH', query.anchor || todayAnchor());
}

function mapDashboard(raw: Record<string, unknown>): VendorDashboardResponse {
  const topProductRaw = raw.topProduct as Record<string, unknown> | null | undefined;
  return {
    totalRevenue: toNumber(raw.totalRevenue),
    totalOrders: toNumber(raw.totalOrders),
    revenueGrowth: toNumber(raw.revenueGrowth),
    ordersGrowth: toNumber(raw.ordersGrowth),
    avgOrderValue: toNumber(raw.avgOrderValue),
    topProduct: topProductRaw ? mapTopProduct(topProductRaw) : null,
  };
}

function mapSalesAnalytics(raw: Record<string, unknown>): SalesAnalyticsResponse {
  const summary = raw.summary as Record<string, unknown> | undefined;
  const chartData = Array.isArray(raw.chartData)
    ? raw.chartData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  const weeklyData = Array.isArray(raw.weeklyData)
    ? raw.weeklyData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  return {
    summary: mapSummaryStats(summary),
    chartData,
    weeklyData,
  };
}

export async function getVendorDashboard(
  query: AnalyticsPeriodQuery = {}
): Promise<VendorDashboardResponse> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/dashboard', {
    params: periodParams(query),
  });
  return mapDashboard(data ?? {});
}

export async function getSalesAnalytics(
  query: AnalyticsPeriodQuery = {}
): Promise<SalesAnalyticsResponse> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/sales', {
    params: periodParams(query),
  });
  return mapSalesAnalytics(data ?? {});
}

export async function getTopProducts(
  limit = 10,
  enrich = false,
  query: AnalyticsPeriodQuery = {}
): Promise<TopProductDto[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/analytics/vendor/products/top', {
    params: { limit, enrich, ...periodParams(query) },
  });
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapTopProduct(item));
}

export async function getProductsByCategory(
  query: AnalyticsPeriodQuery = {}
): Promise<CategoryBreakdownDto[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/analytics/vendor/products/by-category', {
    params: periodParams(query),
  });
  if (!Array.isArray(data)) return [];
  return data.map((item) => mapCategoryBreakdown(item));
}

export async function getTopCustomers(limit = 10): Promise<TopCustomerDto[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/analytics/vendor/customers/top', {
    params: { limit },
  });
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    customerKeycloakId: typeof item.customerKeycloakId === 'string' ? item.customerKeycloakId : '',
    name: typeof item.name === 'string' ? item.name : 'Customer',
    phone: typeof item.phone === 'string' ? item.phone : null,
    orders: toNumber(item.orders),
    spent: toNumber(item.spent),
  }));
}

function mapVendorCustomer(raw: Record<string, unknown>): VendorCustomer {
  const segment = raw.segment;
  return {
    customerKeycloakId:
      typeof raw.customerKeycloakId === 'string' ? raw.customerKeycloakId : '',
    name: typeof raw.name === 'string' ? raw.name : 'Customer',
    phone: typeof raw.phone === 'string' ? raw.phone : null,
    totalOrders: toNumber(raw.orders),
    totalSpent: toNumber(raw.spent),
    firstOrderAt: typeof raw.firstOrderAt === 'string' ? raw.firstOrderAt : null,
    lastOrderAt: typeof raw.lastOrderAt === 'string' ? raw.lastOrderAt : null,
    segment:
      typeof segment === 'string'
        ? (segment as CustomerSegment)
        : null,
  };
}

export async function getVendorCustomers(
  params: VendorCustomerListParams = {}
): Promise<VendorCustomerPage> {
  const uiPage = params.page ?? 1;
  const size = params.size ?? 10;
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/customers', {
    params: {
      page: Math.max(0, uiPage - 1),
      size,
      search: params.search || undefined,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder || undefined,
    },
  });
  const page = data ?? {};
  const items = Array.isArray(page.items) ? page.items : [];
  return {
    data: items.map((item) => mapVendorCustomer(item as Record<string, unknown>)),
    total: toNumber(page.totalElements),
    page: uiPage,
    limit: size,
    totalPages: toNumber(page.totalPages),
  };
}

export async function getVendorCustomerById(
  customerKeycloakId: string
): Promise<VendorCustomer> {
  const { data } = await api.get<Record<string, unknown>>(
    `/analytics/vendor/customers/${encodeURIComponent(customerKeycloakId)}`
  );
  if (!data) {
    throw new Error('Customer not found');
  }
  return mapVendorCustomer(data);
}

export async function getCustomerSummary(): Promise<SummaryStatsDto> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/customers/summary');
  return mapSummaryStats(data);
}

function mapRevenueReport(raw: Record<string, unknown>): RevenueReportResponse {
  const summary = raw.summary as Record<string, unknown> | undefined;
  const chartData = Array.isArray(raw.chartData)
    ? raw.chartData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  const categoryData = Array.isArray(raw.categoryData)
    ? raw.categoryData.map((item) => mapCategoryBreakdown(item as Record<string, unknown>))
    : [];
  return {
    summary: mapSummaryStats(summary),
    chartData,
    categoryData,
  };
}

export async function getRevenueReport(
  from?: string,
  to?: string
): Promise<RevenueReportResponse> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/revenue-report', {
    params: { from, to },
  });
  return mapRevenueReport(data ?? {});
}

export async function getCustomerGrowth(
  query: AnalyticsPeriodQuery = {}
): Promise<CustomerGrowthResponse> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/customers/growth', {
    params: periodParams(query),
  });
  const chartData = Array.isArray(data?.chartData)
    ? data.chartData.map((item) => mapChartPoint(item as Record<string, unknown>))
    : [];
  return { chartData };
}

export async function getCustomerSegments(): Promise<CustomerSegmentsDto> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/vendor/customers/segments');
  return {
    newCustomers: toNumber(data?.newCustomers),
    regular: toNumber(data?.regular),
    vip: toNumber(data?.vip),
    inactive: toNumber(data?.inactive),
  };
}
