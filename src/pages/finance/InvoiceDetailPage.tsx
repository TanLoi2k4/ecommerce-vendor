import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { DashboardCard, LoadingSkeleton } from '../../components/ui';
import { FinanceAlert } from '../../components/finance/FinanceAlert';
import { FinanceDirectionBanner } from '../../components/finance/FinanceDirectionBanner';
import { FinancePageHeader } from '../../components/finance/FinancePageHeader';
import { useVendorInvoiceDetail } from '../../hooks/useVendorInvoiceDetail';
import { useVendorInvoices } from '../../hooks/useVendorInvoices';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { INVOICE_STATUS_LABELS, invoiceStatusColor } from '../../utils/paymentLabels';
import { PAYMENT_STATUS_LABELS } from '../../types/order';
import { toast } from '../../components/ui/Toast';
import type { VendorInvoice } from '../../types/payment';

function canPayInvoice(invoice: VendorInvoice): boolean {
  return invoice.status === 'PENDING' || invoice.status === 'OVERDUE';
}

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceId = id ? parseInt(id, 10) : NaN;

  const { invoice, isLoading, error, refresh } = useVendorInvoiceDetail(
    Number.isNaN(invoiceId) ? null : invoiceId
  );
  const { payingInvoiceId, payInvoice, clearError } = useVendorInvoices({ enabled: false });

  const handlePay = async () => {
    if (!invoice) return;
    clearError();
    try {
      await payInvoice(invoice.id);
    } catch {
      toast.error('Không thể bắt đầu thanh toán VNPay. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (error || !invoice) {
    return (
      <div className="card space-y-4 p-8 text-center">
        <p className="text-error-600">{error || 'Không tìm thấy hóa đơn'}</p>
        <button type="button" onClick={() => navigate('/finance/invoices')} className="btn btn-secondary">
          Quay lại hóa đơn phí sàn
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title={invoice.invoiceCode}
        subtitle={`Hóa đơn phí sàn · ${INVOICE_STATUS_LABELS[invoice.status]}`}
        actions={
          <>
            <button type="button" onClick={() => refresh()} disabled={isLoading} className="btn btn-secondary">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            {canPayInvoice(invoice) && (
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={payingInvoiceId === invoice.id}
                className="btn btn-primary"
              >
                <CreditCard className="h-5 w-5" />
                {payingInvoiceId === invoice.id ? 'Đang chuyển hướng…' : 'Thanh toán VNPay'}
              </button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/finance/invoices')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Hóa đơn phí sàn
        </button>
        <span className={`badge badge-${invoiceStatusColor(invoice.status)}`}>
          {INVOICE_STATUS_LABELS[invoice.status]}
        </span>
      </div>

      <FinanceDirectionBanner
        direction="vendor-to-platform"
        description="Khoản này là phí hoa hồng cửa hàng trả cho sàn, không trừ vào số dư ví."
        links={[{ label: 'Ví & rút tiền', to: '/finance/wallet' }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Số tiền phải trả"
          value={formatCurrency(invoice.totalAmount)}
          icon={<FileText className="h-6 w-6" />}
          comparison="Phí hoa hồng nền tảng"
        />
        <DashboardCard
          title="Hạn thanh toán"
          value={invoice.dueDate ? formatDateTime(invoice.dueDate) : '—'}
          icon={<Calendar className="h-6 w-6" />}
          comparison={invoice.status === 'OVERDUE' ? 'Đã quá hạn' : 'Thanh toán trước hạn để tránh phạt'}
        />
        <DashboardCard
          title="Thanh toán"
          value={
            invoice.paymentStatus
              ? PAYMENT_STATUS_LABELS[invoice.paymentStatus] ?? invoice.paymentStatus
              : 'Chưa tạo giao dịch'
          }
          icon={<CreditCard className="h-6 w-6" />}
          comparison={invoice.paymentId ? `Mã thanh toán #${invoice.paymentId}` : 'Thanh toán qua VNPay'}
        />
      </div>

      {canPayInvoice(invoice) && (
        <FinanceAlert tone="warning" title="Cần thanh toán phí sàn">
          Thanh toán hóa đơn này qua VNPay trước hạn. Việc này không ảnh hưởng đến lệnh rút tiền doanh thu.
        </FinanceAlert>
      )}

      <div className="card">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chi tiết giao dịch</h3>
        </div>
        <dl className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">Mã hóa đơn</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">{invoice.invoiceCode}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Trạng thái hóa đơn</dt>
            <dd className="mt-1">
              <span className={`badge badge-${invoiceStatusColor(invoice.status)}`}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Mã thanh toán</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">{invoice.paymentId ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Trạng thái thanh toán</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
              {invoice.paymentStatus ? PAYMENT_STATUS_LABELS[invoice.paymentStatus] : '—'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-gray-500">Mã giao dịch nhà cung cấp</dt>
            <dd className="mt-1 break-all font-mono text-sm text-gray-700 dark:text-gray-300">
              {invoice.providerPaymentIntentId ?? '—'}
            </dd>
          </div>
          {invoice.checkoutUrl && canPayInvoice(invoice) && (
            <div className="sm:col-span-2">
              <dt className="mb-2 text-sm text-gray-500">Liên kết VNPay</dt>
              <dd>
                <a
                  href={invoice.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  Mở trang thanh toán
                  <ExternalLink className="h-4 w-4" />
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
