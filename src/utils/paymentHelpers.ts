/**
 * Finance summary derived from payout history and optional API summary.
 */
import type { VendorFinanceSummary, VendorPayout, VendorPayoutStatus } from '../types/payment';

export const ACTIVE_VENDOR_PAYOUT_STATUSES: VendorPayoutStatus[] = [
  'PENDING_APPROVAL',
  'APPROVED',
  'PROCESSING',
];

export interface FinanceSummary {
  /** Sum of netAmount from completed payouts */
  totalWithdrawn: number;
  /** Sum of grossAmount from completed payouts */
  totalGrossPaidOut: number;
  /** Active payout awaiting settlement, if any */
  activePayout: VendorPayout | null;
  /** Whether vendor has an in-flight payout request */
  hasActivePayout: boolean;
  /** Pending earnings available for next payout request */
  availableBalance: number | null;
  pendingPayableCount: number;
  pendingInvoiceAmount: number;
  pendingInvoiceCount: number;
  canRequestPayout: boolean;
  minimumPayoutAmount: number;
}

export function computeFinanceSummary(payouts: VendorPayout[]): FinanceSummary {
  const completed = payouts.filter((p) => p.status === 'COMPLETED');
  const activePayout =
    payouts.find((p) => ACTIVE_VENDOR_PAYOUT_STATUSES.includes(p.status)) ?? null;

  const totalWithdrawn = completed.reduce((sum, p) => sum + p.netAmount, 0);
  const totalGrossPaidOut = completed.reduce((sum, p) => sum + p.grossAmount, 0);

  return {
    totalWithdrawn,
    totalGrossPaidOut,
    activePayout,
    hasActivePayout: activePayout != null,
    availableBalance: null,
    pendingPayableCount: 0,
    pendingInvoiceAmount: 0,
    pendingInvoiceCount: 0,
    canRequestPayout: false,
    minimumPayoutAmount: 0,
  };
}

export function mergeFinanceSummaryWithApi(
  base: FinanceSummary,
  apiSummary: VendorFinanceSummary | null
): FinanceSummary {
  if (!apiSummary) return base;
  return {
    ...base,
    totalWithdrawn: apiSummary.totalWithdrawn,
    totalGrossPaidOut: apiSummary.totalGrossPaidOut,
    availableBalance: apiSummary.availableBalance,
    pendingPayableCount: apiSummary.pendingPayableCount,
    pendingInvoiceAmount: apiSummary.pendingInvoiceAmount,
    pendingInvoiceCount: apiSummary.pendingInvoiceCount,
    hasActivePayout: apiSummary.activePayoutCount > 0 || base.hasActivePayout,
    canRequestPayout: apiSummary.canRequestPayout,
    minimumPayoutAmount: apiSummary.minimumPayoutAmount,
  };
}

export interface PayoutChartPoint {
  name: string;
  amount: number;
  grossAmount: number;
}

/** Chart / table data from payout history */
export function buildPayoutChartData(payouts: VendorPayout[]): PayoutChartPoint[] {
  const completed = payouts.filter((p) => p.status === 'COMPLETED' && p.completedAt);
  const byMonth = new Map<string, { amount: number; grossAmount: number }>();

  for (const payout of completed) {
    if (!payout.completedAt) continue;
    const date = new Date(payout.completedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const entry = byMonth.get(key) ?? { amount: 0, grossAmount: 0 };
    entry.amount += payout.netAmount;
    entry.grossAmount += payout.grossAmount;
    byMonth.set(key, entry);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([name, value]) => ({
      name,
      amount: value.amount,
      grossAmount: value.grossAmount,
    }));
}

/** Recent payout rows for timeline tables */
export function buildPayoutTimelineRows(payouts: VendorPayout[], limit = 10) {
  return [...payouts]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}
