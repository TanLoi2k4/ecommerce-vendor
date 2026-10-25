import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, FileText, RefreshCw } from 'lucide-react';
import { DashboardCard, EmptyState, LoadingSkeleton, Pagination } from '../../components/ui';
import { FinanceAlert } from '../../components/finance/FinanceAlert';
import { FinanceDirectionBanner } from '../../components/finance/FinanceDirectionBanner';
import { FinancePageHeader } from '../../components/finance/FinancePageHeader';
import { FinanceStatusTabs } from '../../components/finance/FinanceStatusTabs';
import { useVendorInvoices, type InvoiceTab } from '../../hooks/useVendorInvoices';
import { useVendorPayouts } from '../../hooks/useVendorPayouts';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { INVOICE_STATUS_LABELS, invoiceStatusColor } from '../../utils/paymentLabels';
import { PAYMENT_STATUS_LABELS } from '../../types/order';
import { toast } from '../../components/ui/Toast';
import type { VendorInvoice } from '../../types/payment';

const PAGE_SIZE = 10;

const TABS: { id: InvoiceTab; label: string }[] = [
  { id: 'PENDING', label: 'Chờ thanh toán' },
  { id: 'OVERDUE', label: 'Quá hạn' },
  { id: 'PAID', label: 'Đã thanh toán' },
  { id: 'ALL', label: 'Tất cả' },
];

const EMPTY_TITLES: Record<InvoiceTab, string> = {
  ALL: 'Chưa có hóa đơn phí sàn',
  PENDING: 'Chưa có hóa đơn chờ thanh toán',
  PAID: 'Chưa có hóa đơn đã thanh toán',
  OVERDUE: 'Chưa có hóa đơn quá hạn',
};

const EMPTY_DESCRIPTIONS: Record<InvoiceTab, string> = {
  ALL: 'Hóa đơn hoa hồng sẽ xuất hiện khi phí sàn đến hạn.',
  PENDING: 'Hóa đơn phí sàn sẽ hiện ở đây khi hoa hồng được gom.',
  PAID: 'Hóa đơn đã thanh toán qua VNPay sẽ hiện ở đây.',
  OVERDUE: 'Hóa đơn quá hạn thanh toán sẽ hiện ở đây.',
};

function canPayInvoice(invoice: VendorInvoice): boolean {
  return invoice.status === 'PENDING' || invoice.status === 'OVERDUE';
}

export function InvoicesListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InvoiceTab>('PENDING');
  const [page, setPage] = useState(1);
  const {
    invoices,
    isLoading,
    payingInvoiceId,
    error,
    refresh,
    payInvoice,
    clearError,
  } = useVendorInvoices({ tab: activeTab });
  const { summary } = useVendorPayouts();

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return invoices.slice(start, start + PAGE_SIZE);
  }, [invoices, page]);

  const tabAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const { pendingInvoiceAmount, pendingInvoiceCount } = summary;

  const handlePay = async (invoice: VendorInvoice) => {
    clearError();
    try {
      await payInvoice(invoice.id);
    } catch {
      toast.error('Không thể bắt đầu thanh toán VNPay. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Hóa đơn phí sàn"
        subtitle="Thanh toán hoa hồng cho Avora qua VNPay — tách biệt với lần rút tiền"
        actions={
          <button type="button" onClick={() => refresh()} disabled={isLoading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        }
      />

      <FinanceDirectionBanner
        direction="vendor-to-platform"
        links={[{ label: 'Ví & rút tiền', to: '/finance/wallet' }]}
      />

      {error && (
        <FinanceAlert tone="error" title="Không tải được hóa đơn">
          {error}
        </FinanceAlert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Phí sàn đang nợ"
          value={formatCurrency(pendingInvoiceAmount)}
          icon={<FileText className="h-6 w-6" />}
          comparison={
            pendingInvoiceCount > 0
              ? `${pendingInvoiceCount} hóa đơn chưa thanh toán`
              : 'Không còn hóa đơn chờ thanh toán'
          }
        />
        <DashboardCard
          title={TABS.find((tab) => tab.id === activeTab)?.label ?? 'Tab hiện tại'}
          value={invoices.length}
          icon={<Calendar className="h-6 w-6" />}
          comparison={invoices.length > 0 ? `Tổng ${formatCurrency(tabAmount)}` : 'Không có bản ghi'}
        />
        <DashboardCard
          title="Cách thanh toán"
          value="VNPay"
          icon={<CreditCard className="h-6 w-6" />}
          comparison="Không cấn trừ vào doanh thu đang chờ rút"
        />
      </div>

      <FinanceStatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

      <div className="card">
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title={EMPTY_TITLES[activeTab]}
            description={EMPTY_DESCRIPTIONS[activeTab]}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hóa đơn</th>
                    <th>Trạng thái</th>
                    <th>Số tiền</th>
                    <th>Hạn thanh toán</th>
                    <th>Thanh toán</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      <td>
                        <Link
                          to={`/finance/invoices/${invoice.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {invoice.invoiceCode}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge badge-${invoiceStatusColor(invoice.status)}`}>
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </span>
                      </td>
                      <td className="font-medium">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="text-sm text-gray-500">
                        {invoice.dueDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateTime(invoice.dueDate)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-sm text-gray-500">
                        {invoice.paymentStatus
                          ? PAYMENT_STATUS_LABELS[invoice.paymentStatus] ?? invoice.paymentStatus
                          : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canPayInvoice(invoice) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handlePay(invoice);
                              }}
                              disabled={payingInvoiceId === invoice.id}
                              className="btn btn-primary btn-sm"
                            >
                              <CreditCard className="h-4 w-4" />
                              {payingInvoiceId === invoice.id ? 'Đang chuyển hướng…' : 'Thanh toán VNPay'}
                            </button>
                          )}
                          <Link
                            to={`/finance/invoices/${invoice.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-secondary btn-sm"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={invoices.length}
              limit={PAGE_SIZE}
            />
          </>
        )}
      </div>
    </div>
  );
}
