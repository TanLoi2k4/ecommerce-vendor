/** Mirrors analytics-service vendor DTOs */

import type { OrderStatsPeriod } from './order';

export type AnalyticsRange = '7d' | '30d' | '90d' | '1y';
export type AnalyticsPeriod = OrderStatsPeriod;

export interface AnalyticsPeriodQuery {
  period?: AnalyticsPeriod;
  anchor?: string;
}

export interface SummaryStatsDto {
  totalRevenue: number;
  totalOrders: number;
  growth?: number;
  ordersGrowth?: number;
  avgOrderValue: number;
  avgOrderValueGrowth?: number;
  totalCustomers: number | null;
  newCustomers: number | null;
  commission: number | null;
  netRevenue: number | null;
}

export interface ChartPointDto {
  date: string | null;
  name: string | null;
  revenue: number;
  orders: number;
  value: number | null;
}

export interface TopProductDto {
  productId: number;
  name: string;
  quantity: number;
  sales: number;
  revenue: number;
  stock?: number | null;
  rating?: number | null;
  imageUrl?: string | null;
  categoryName?: string | null;
}

export interface CategoryBreakdownDto {
  name: string;
  revenue: number;
  quantitySold: number;
  value: number;
}

export interface TopCustomerDto {
  customerKeycloakId: string;
  name: string;
  phone?: string | null;
  orders: number;
  spent: number;
}

export interface VendorDashboardResponse {
  totalRevenue: number;
  totalOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topProduct: TopProductDto | null;
  avgOrderValue: number;
}

export interface SalesAnalyticsResponse {
  summary: SummaryStatsDto;
  chartData: ChartPointDto[];
  weeklyData: ChartPointDto[];
}

export interface RevenueReportResponse {
  summary: SummaryStatsDto;
  chartData: ChartPointDto[];
  categoryData: CategoryBreakdownDto[];
}

export interface CustomerGrowthResponse {
  chartData: ChartPointDto[];
}

export interface CustomerSegmentsDto {
  newCustomers: number;
  regular: number;
  vip: number;
  inactive: number;
}
