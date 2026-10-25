import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  Send,
  Wallet,
} from 'lucide-react';
import {
  ChartCard,
  DashboardCard,
  EmptyState,
  Modal,
  LoadingSkeleton,
  Pagination,
} from '../../components/ui';
import { FinanceAlert } from '../../components/finance/FinanceAlert';
import { FinanceDirectionBanner } from '../../components/finance/FinanceDirectionBanner';
import { FinancePageHeader } from '../../components/finance/FinancePageHeader';
import { useVendorPayouts } from '../../hooks/useVendorPayouts';
import { getBankAccount } from '../../api/bankAccountApi';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  VENDOR_PAYOUT_STATUS_LABELS,
  vendorPayoutStatusColor,
} from '../../utils/paymentLabels';
import { buildPayoutChartData } from '../../utils/paymentHelpers';
import { toast } from '../../components/ui/Toast';
import { PAYMENT_STATUS_LABELS } from '../../types/order';
import type { VendorPayout } from '../../types/payment';

const PAGE_SIZE = 10;

export function WalletPage() {
  const navigate = useNavigate();
  const {
    payouts,
    summary,
    isLoading,
    isRequesting,
    error,
    refresh,
    requestPayout,
    clearError,
  } = useVendorPayouts();

  const [confirmModal, setConfirmModal] = useState(false);
  const [checkingBank, setCheckingBank] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<VendorPayout | null>(null);
  const [page, setPage] = useState(1);

  const chartData = buildPayoutChartData(payouts);
  const {
    totalWithdrawn,
    totalGrossPaidOut,
    activePayout,
    hasActivePayout,
    availableBalance,
    pendingPayableCount,
    pendingInvoiceAmount,
    pendingInvoiceCount,
    canRequestPayout,
    minimumPayoutAmount,
  } = summary;

  const totalPages = Math.max(1, Math.ceil(payouts.length / PAGE_SIZE));
  const paginatedPayouts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return payouts.slice(start, start + PAGE_SIZE);
  }, [payouts, page]);

  const handleRequestPayoutClick = async () => {
    clearError();
    setCheckingBank(true);
    try {
      const bankAccount = await getBankAccount();
      if (!bankAccount || bankAccount.verificationStatus !== 'VERIFIED') {
        toast.error('Cần tài khoản ngân hàng đã xác minh. Đang chuyển đến Cài đặt thanh toán.');
        navigate('/settings/payment');
        return;
      }
      setConfirmModal(true);
    } catch {
      toast.error('Không thể xác minh tài khoản ngân hàng. Vui lòng kiểm tra Cài đặt thanh toán.');
      navigate('/settings/payment');
    } finally {
      setCheckingBank(false);
    }
  };

  const handleConfirmPayout = async () => {
    try {
      const payout = await requestPayout();
      setConfirmModal(false);
      toast.success(`Yêu cầu rút tiền ${payout.payoutCode} đã được gửi chờ duyệt.`);
    } catch {
      // error surfaced via store.error
    }
  };

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Ví"
        subtitle="Rút doanh thu cửa hàng về tài khoản ngân hàng đã xác minh"
        actions={
          <>
            <button
              type="button"
              onClick={() => refresh()}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleRequestPayoutClick}
              disabled={isRequesting || checkingBank || hasActivePayout || !canRequestPayout}
              className="btn btn-primary"
            >
              <Send className="h-5 w-5" />
              {checkingBank ? 'Đang kiểm tra...' : isRequesting ? 'Đang gửi...' : 'Yêu cầu rút tiền'}
            </button>
          </>
        }
      />

      <FinanceDirectionBanner
        direction="platform-to-vendor"
        links={[
          { label: 'Thu nhập chờ', to: '/finance/payables' },
          { label: 'Tài khoản ngân hàng', to: '/settings/payment' },
        ]}
      />

      {error && (
        <FinanceAlert tone="error" title="Không gửi được yêu cầu rút tiền">
          {error}
        </FinanceAlert>
      )}

      {pendingInvoiceCount > 0 && (
        <FinanceAlert tone="warning" title="Có phí sàn chưa thanh toán">
          {pendingInvoiceCount} hóa đơn phí sàn còn {formatCurrency(pendingInvoiceAmount)}. Phí này
          tách khỏi lần rút tiền.{' '}
          <Link to="/finance/invoices" className="font-medium text-primary-600 hover:underline">
            Thanh toán hóa đơn
          </Link>
        </FinanceAlert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Số dư khả dụng"
          value={availableBalance != null ? formatCurrency(availableBalance) : '—'}
          icon={<Wallet className="h-6 w-6" />}
          comparison={
            pendingPayableCount > 0
              ? `${pendingPayableCount} khoản thu nhập chờ`
              : minimumPayoutAmount > 0
                ? `Tối thiểu ${formatCurrency(minimumPayoutAmount)} mỗi lần rút`
                : 'Chưa có khoản nào đủ điều kiện rút'
          }
        />
        <DashboardCard
          title="Đã rút"
          value={formatCurrency(totalGrossPaidOut)}
          icon={<ArrowUpRight className="h-6 w-6" />}
          comparison={`Thực nhận ${formatCurrency(totalWithdrawn)}`}
        />
        <DashboardCard
          title="Lệnh rút tiền"
          value={payouts.length}
          icon={<Send className="h-6 w-6" />}
          comparison={
            hasActivePayout && activePayout
              ? `${VENDOR_PAYOUT_STATUS_LABELS[activePayout.status]} · ${activePayout.payoutCode}`
              : 'Chưa có lệnh đang xử lý'
          }
        />
      </div>

      {hasActivePayout && activePayout && (
        <button
          type="button"
          onClick={() => setSelectedPayout(activePayout)}
          className="card flex w-full items-center gap-4 border-l-4 border-warning-500 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div className="rounded-lg bg-warning-100 p-2 dark:bg-warning-900/30">
            <Clock className="h-5 w-5 text-warning-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Lệnh rút {activePayout.payoutCode} đang xử lý
            </p>
            <p className="text-sm text-gray-500">
              {VENDOR_PAYOUT_STATUS_LABELS[activePayout.status]} —{' '}
              {formatCurrency(activePayout.grossAmount)}
            </p>
          </div>
          <span className={`badge badge-${vendorPayoutStatusColor(activePayout.status)}`}>
            {VENDOR_PAYOUT_STATUS_LABELS[activePayout.status]}
          </span>
        </button>
      )}

      {chartData.length > 0 && (
        <ChartCard
          title="Thực nhận theo tháng"
          type="line"
          data={chartData as unknown as Record<string, unknown>[]}
          dataKeys={[{ key: 'amount', name: 'Thực nhận', color: '#22c55e' }]}
        />
      )}

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lịch sử rút tiền</h3>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" />
          </div>
        ) : payouts.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title="Chưa có lần rút tiền nào"
            description="Hoàn tất đơn hàng, rồi yêu cầu rút khi có thu nhập chờ."
            action={
              <button type="button" onClick={() => navigate('/finance/payables')} className="btn btn-secondary">
                Xem thu nhập chờ
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã lệnh</th>
                    <th>Trạng thái</th>
                    <th>Tổng</th>
                    <th>Thực nhận</th>
                    <th>Ngân hàng</th>
                    <th>Ngày tạo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setSelectedPayout(payout)}
                    >
                      <td className="font-medium">{payout.payoutCode}</td>
                      <td>
                        <span className={`badge badge-${vendorPayoutStatusColor(payout.status)}`}>
                          {VENDOR_PAYOUT_STATUS_LABELS[payout.status]}
                        </span>
                      </td>
                      <td>{formatCurrency(payout.grossAmount)}</td>
                      <td className="font-medium text-success-600">{formatCurrency(payout.netAmount)}</td>
                      <td className="text-sm text-gray-500">
                        {payout.bankName ?? '—'}
                        {payout.bankAccountNumber ? ` •••${payout.bankAccountNumber.slice(-4)}` : ''}
                      </td>
                      <td className="text-sm text-gray-500">
                        {payout.createdAt ? formatDateTime(payout.createdAt) : '—'}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayout(payout);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </button>
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
              total={payouts.length}
              limit={PAGE_SIZE}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        title="Yêu cầu rút tiền"
        footer={
          <>
            <button type="button" onClick={() => setConfirmModal(false)} className="btn btn-secondary">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmPayout}
              disabled={isRequesting}
              className="btn btn-primary"
            >
              {isRequesting ? 'Đang gửi...' : 'Xác nhận yêu cầu'}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Toàn bộ thu nhập chờ sẽ được gom thành một lệnh rút và chuyển vào tài khoản ngân hàng đã
            xác minh sau khi quản trị viên phê duyệt.
          </p>
          <p>
            Số tiền lần này:{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              {availableBalance != null ? formatCurrency(availableBalance) : '—'}
            </strong>
          </p>
          <p className="text-warning-600">Chỉ được có một lệnh rút đang xử lý tại một thời điểm.</p>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        title="Chi tiết lệnh rút"
        size="lg"
      >
        {selectedPayout && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedPayout.payoutCode}
              </p>
              <span className={`badge badge-${vendorPayoutStatusColor(selectedPayout.status)}`}>
                {VENDOR_PAYOUT_STATUS_LABELS[selectedPayout.status]}
              </span>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-500">Tổng</dt>
                <dd className="mt-1 font-medium">{formatCurrency(selectedPayout.grossAmount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Phí giao dịch</dt>
                <dd className="mt-1 font-medium">{formatCurrency(selectedPayout.transactionFee)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Thực nhận</dt>
                <dd className="mt-1 font-medium text-success-600">
                  {formatCurrency(selectedPayout.netAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Ngân hàng</dt>
                <dd className="mt-1 text-sm">
                  {selectedPayout.bankAccountName ?? '—'}
                  <p className="text-gray-500">
                    {selectedPayout.bankName ?? '—'}
                    {selectedPayout.bankAccountNumber
                      ? ` · •••${selectedPayout.bankAccountNumber.slice(-4)}`
                      : ''}
                  </p>
                </dd>
              </div>
              {selectedPayout.createdAt && (
                <div>
                  <dt className="text-xs text-gray-500">Yêu cầu lúc</dt>
                  <dd className="mt-1 text-sm">{formatDateTime(selectedPayout.createdAt)}</dd>
                </div>
              )}
              {selectedPayout.completedAt && (
                <div>
                  <dt className="text-xs text-gray-500">Hoàn tất lúc</dt>
                  <dd className="mt-1 text-sm">{formatDateTime(selectedPayout.completedAt)}</dd>
                </div>
              )}
              {selectedPayout.rejectionReason && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500">Lý do từ chối</dt>
                  <dd className="mt-1 text-sm text-error-600">{selectedPayout.rejectionReason}</dd>
                </div>
              )}
            </dl>

            {selectedPayout.payableItems && selectedPayout.payableItems.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <FileText className="h-4 w-4" />
                  Khoản được gom ({selectedPayout.payableItems.length})
                </h4>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Đơn hàng</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayout.payableItems.map((item) => (
                        <tr key={item.id}>
                          <td className="font-mono text-xs">{item.orderCode}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td>
                            {PAYMENT_STATUS_LABELS[item.status] ?? item.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={() => setSelectedPayout(null)} className="btn btn-secondary">
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
