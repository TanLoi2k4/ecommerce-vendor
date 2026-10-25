import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Package, Truck, CheckCircle, XCircle, Send, RotateCcw } from 'lucide-react';
import {
  DataTable,
  Pagination,
  EmptyState,
  LoadingSkeleton,
  SearchBar,
} from '../../components/ui';
import { useVendorOrders, useVendorOrderStats } from '../../hooks/useVendorOrders';
import { useVendorShipments } from '../../hooks/useVendorShipments';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  ORDER_ROUTE_STATUS_MAP,
  SUB_ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SUB_ORDER_PAYOUT_STATUS_LABELS,
  subOrderStatusColor,
  paymentStatusColor,
  subOrderPayoutStatusColor,
  type SubOrderStatus,
  type SubOrderSummary,
} from '../../types/order';
import {
  formatCarrierLabel,
  shipmentStatusLabel,
} from '../../utils/shipmentLabels';

const TAB_STATUSES: {
  key: SubOrderStatus | 'ALL';
  label: string;
  icon: React.ReactNode;
  route?: string;
}[] = [
  { key: 'ALL', label: 'Tất cả', icon: <Package className="w-4 h-4" /> },
  { key: 'CREATED', label: 'Mới', icon: <Clock className="w-4 h-4" />, route: 'pending' },
  { key: 'PROCESSING', label: 'Đang xử lý', icon: <Package className="w-4 h-4" />, route: 'processing' },
  {
    key: 'SHIPPING_REQUESTED',
    label: 'Đã yêu cầu giao',
    icon: <Send className="w-4 h-4" />,
    route: 'shipping-requested',
  },
  { key: 'SHIPPING', label: 'Đang giao', icon: <Truck className="w-4 h-4" />, route: 'shipped' },
  { key: 'COMPLETED', label: 'Hoàn thành', icon: <CheckCircle className="w-4 h-4" />, route: 'completed' },
  { key: 'RETURNED', label: 'Đã trả hàng', icon: <RotateCcw className="w-4 h-4" />, route: 'returned' },
  { key: 'CANCELLED', label: 'Đã hủy', icon: <XCircle className="w-4 h-4" />, route: 'cancelled' },
];

function resolveStatusFilter(routeStatus?: string): SubOrderStatus | undefined {
  if (!routeStatus) return undefined;
  return ORDER_ROUTE_STATUS_MAP[routeStatus.toLowerCase()];
}

function listHref(route?: string) {
  return route ? `/orders/list?status=${route}` : '/orders/list';
}

export function OrdersListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeStatus = searchParams.get('status') ?? undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const statusFilter = resolveStatusFilter(routeStatus);

  const { result, isLoading, error, refresh } = useVendorOrders({
    page,
    size: 10,
    status: statusFilter,
    q: search,
  });
  const { stats, refresh: refreshStats } = useVendorOrderStats();

  const {
    getShipmentForSubOrder,
    loading: shipmentsLoading,
    error: shipmentsError,
    refresh: refreshShipments,
  } = useVendorShipments(true);

  useEffect(() => {
    setPage(1);
  }, [routeStatus, search]);

  const columns = [
    {
      key: 'orderCode',
      header: 'Đơn hàng',
      render: (row: SubOrderSummary) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {row.orderCode ?? `#${row.id}`}
          </p>
          <p className="text-xs text-gray-500">
            Đơn phụ #{row.id}
            {row.createdAt ? ` · ${formatDateTime(row.createdAt)}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Khách hàng',
      render: (row: SubOrderSummary) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {row.customerName ?? '—'}
          </p>
          {row.customerPhone && (
            <p className="text-xs text-gray-500">{row.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: SubOrderSummary) => {
        const shipment = getShipmentForSubOrder(row.id);
        const bookingFailed = shipment?.status === 'BOOKING_FAILED';

        return (
          <div className="flex flex-col items-start gap-1">
            <span className={`badge badge-${subOrderStatusColor(row.status)}`}>
              {SUB_ORDER_STATUS_LABELS[row.status]}
            </span>
            {bookingFailed && (
              <span className="badge badge-error text-xs">Đặt VC thất bại</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'shipment',
      header: 'ĐVVC / Mã vận đơn',
      render: (row: SubOrderSummary) => {
        if (shipmentsLoading) {
          return <span className="text-gray-400 text-sm">…</span>;
        }

        const shipment = getShipmentForSubOrder(row.id);
        if (!shipment) {
          if (row.status === 'SHIPPING_REQUESTED') {
            return <span className="text-xs text-gray-500">Chờ xác nhận</span>;
          }
          return <span className="text-gray-400">—</span>;
        }

        const trackingCode = shipment.carrierTrackingId || shipment.externalShipmentId;

        return (
          <div className="text-sm">
            <p className="text-gray-900 dark:text-gray-100">
              {formatCarrierLabel(shipment.carrierCode, shipment.carrierName)}
            </p>
            {trackingCode ? (
              <p className="text-xs text-gray-500 font-mono truncate max-w-[160px]">
                {trackingCode}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {shipmentStatusLabel[shipment.status]}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: 'Thanh toán',
      render: (row: SubOrderSummary) => (
        <div className="flex flex-col items-start gap-1">
          {row.paymentMethod && (
            <span className="text-xs text-gray-500">
              {PAYMENT_METHOD_LABELS[row.paymentMethod]}
            </span>
          )}
          {row.paymentStatus ? (
            <span className={`badge badge-${paymentStatusColor(row.paymentStatus)}`}>
              {PAYMENT_STATUS_LABELS[row.paymentStatus]}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'payoutStatus',
      header: 'Chi trả',
      render: (row: SubOrderSummary) => (
        <span className={`badge badge-${subOrderPayoutStatusColor(row.payoutStatus)}`}>
          {SUB_ORDER_PAYOUT_STATUS_LABELS[row.payoutStatus]}
        </span>
      ),
    },
    {
      key: 'finalAmount',
      header: 'Tổng cộng',
      render: (row: SubOrderSummary) => (
        <span className="font-semibold text-primary-600">
          {formatCurrency(Number(row.finalAmount))}
        </span>
      ),
    },
  ];

  const pageTitle = routeStatus
    ? `Danh sách đơn hàng — ${TAB_STATUSES.find((t) => t.route === routeStatus)?.label ?? routeStatus}`
    : 'Danh sách đơn hàng';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Quản lý đơn phụ được gán cho cửa hàng của bạn
        </p>
      </div>

      <SearchBar
        placeholder="Tìm mã đơn, tên khách, SĐT hoặc mã đơn phụ…"
        onSearch={setSearch}
        className="max-w-xl"
      />

      {(error || shipmentsError) && (
        <div className="rounded-lg border border-error-200 bg-error-50 dark:bg-error-900/20 px-4 py-3 text-sm text-error-700 dark:text-error-300 flex items-center justify-between gap-4">
          <span>{error ?? shipmentsError}</span>
          <button
            type="button"
            onClick={() => {
              refresh();
              refreshShipments();
              void refreshStats();
            }}
            className="btn btn-secondary btn-sm"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {TAB_STATUSES.map((tab) => {
          const isActive =
            tab.key === 'ALL' ? !statusFilter : statusFilter === tab.key;
          const href = listHref(tab.route);
          const count =
            tab.key === 'ALL'
              ? stats?.total
              : stats?.byStatus?.[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setPage(1);
                navigate(href);
              }}
              className={`card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow ${
                isActive ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600">
                {tab.icon}
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">{tab.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {count ?? '—'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : !result?.data.length ? (
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Đơn phụ sẽ hiển thị ở đây khi khách hàng mua sản phẩm của bạn"
          variant="no-data"
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={result.data}
            keyExtractor={(row) => String(row.id)}
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
          />
          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            total={result.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
