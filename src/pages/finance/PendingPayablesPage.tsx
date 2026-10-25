import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, Search, Send, Wallet } from 'lucide-react';
import { DashboardCard, EmptyState, LoadingSkeleton, Pagination } from '../../components/ui';
import { FinanceAlert } from '../../components/finance/FinanceAlert';
import { FinanceDirectionBanner } from '../../components/finance/FinanceDirectionBanner';
import { FinancePageHeader } from '../../components/finance/FinancePageHeader';
import { useVendorPayables } from '../../hooks/useVendorPayables';
import { useVendorPayouts } from '../../hooks/useVendorPayouts';
import type { PlatformPayableToVendor } from '../../types/payment';
import { PAYMENT_STATUS_LABELS, paymentStatusColor } from '../../types/order';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const PAGE_SIZE = 10;

function matchesSearch(payable: PlatformPayableToVendor, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    payable.orderCode.toLowerCase().includes(normalized) ||
    String(payable.subOrderId ?? '').includes(normalized) ||
    String(payable.orderId ?? '').includes(normalized)
  );
}

export function PendingPayablesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { payables, totalAmount, count, isLoading, error, refresh } = useVendorPayables();
  const { summary } = useVendorPayouts();

  const filteredPayables = useMemo(
    () => payables.filter((item) => matchesSearch(item, search)),
    [payables, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayables.length / PAGE_SIZE));
  const paginatedPayables = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPayables.slice(start, start + PAGE_SIZE);
  }, [filteredPayables, page]);

  const { availableBalance, canRequestPayout, hasActivePayout } = summary;

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Thu nhập chờ"
        subtitle="Đơn con đã hoàn tất, chưa gom vào lệnh rút tiền"
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
              onClick={() => navigate('/finance/wallet')}
              disabled={!canRequestPayout}
              className="btn btn-primary"
            >
              <Send className="h-5 w-5" />
              Yêu cầu rút tiền
            </button>
          </>
        }
      />

      <FinanceDirectionBanner
        direction="platform-to-vendor"
        description="Các khoản này sẽ được gom khi bạn yêu cầu rút từ Ví. Phí sàn thanh toán riêng qua hóa đơn."
        links={[
          { label: 'Ví & rút tiền', to: '/finance/wallet' },
          { label: 'Hóa đơn phí sàn', to: '/finance/invoices' },
        ]}
      />

      {error && (
        <FinanceAlert tone="error" title="Không tải được thu nhập chờ">
          {error}
        </FinanceAlert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          title="Tổng đang chờ"
          value={formatCurrency(totalAmount)}
          icon={<Wallet className="h-6 w-6" />}
          comparison={
            availableBalance != null ? `Số dư ví ${formatCurrency(availableBalance)}` : 'Đang đồng bộ số dư ví'
          }
        />
        <DashboardCard
          title="Số khoản"
          value={count}
          icon={<Clock className="h-6 w-6" />}
          comparison={
            filteredPayables.length !== count
              ? `${filteredPayables.length} hiển thị sau lọc`
              : 'Chưa gom vào lệnh rút nào'
          }
        />
        <DashboardCard
          title="Trạng thái rút"
          value={canRequestPayout ? 'Có thể rút' : hasActivePayout ? 'Đang xử lý' : 'Chưa thể rút'}
          icon={<Send className="h-6 w-6" />}
          comparison={
            canRequestPayout
              ? 'Đủ điều kiện gửi yêu cầu rút tiền'
              : hasActivePayout
                ? 'Chờ lệnh rút hiện tại hoàn tất'
                : 'Cần có thu nhập chờ để rút'
          }
        />
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chi tiết theo đơn</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm đơn hàng hoặc đơn con..."
              className="input w-full pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" />
          </div>
        ) : payables.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title="Không có thu nhập chờ"
            description="Đơn đã hoàn tất và thanh toán sẽ hiện ở đây cho đến khi bạn yêu cầu rút tiền."
            action={
              <button type="button" onClick={() => navigate('/finance/wallet')} className="btn btn-secondary">
                Đến Ví
              </button>
            }
          />
        ) : filteredPayables.length === 0 ? (
          <EmptyState
            icon={<Search className="h-12 w-12" />}
            title="Không tìm thấy kết quả"
            description="Thử mã đơn hàng hoặc ID đơn con khác."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Đơn hàng</th>
                    <th>Đơn con</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayables.map((payable) => (
                    <tr key={payable.id}>
                      <td className="font-medium">{payable.orderCode}</td>
                      <td>
                        {payable.subOrderId != null ? (
                          <Link
                            to={`/orders/${payable.subOrderId}`}
                            className="text-primary-600 hover:underline"
                          >
                            #{payable.subOrderId}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="font-medium text-success-600">{formatCurrency(payable.amount)}</td>
                      <td>
                        <span className={`badge badge-${paymentStatusColor(payable.status)}`}>
                          {PAYMENT_STATUS_LABELS[payable.status]}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {payable.createdAt ? formatDateTime(payable.createdAt) : '—'}
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
              total={filteredPayables.length}
              limit={PAGE_SIZE}
            />
          </>
        )}
      </div>
    </div>
  );
}
