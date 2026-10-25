import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  DataTable,
  Pagination,
  EmptyState,
  LoadingSkeleton,
} from '../../components/ui';
import { useVendorShipments } from '../../hooks/useVendorShipments';
import { formatDateTime } from '../../utils/helpers';
import {
  filterShipmentsByStatus,
  resolveShipmentStatusFilter,
  type Shipment,
  type ShipmentStatus,
} from '../../types/shipment';
import {
  formatCarrierLabel,
  shipmentStatusColor,
  shipmentStatusLabel,
} from '../../utils/shipmentLabels';

const PAGE_SIZE = 10;

type ShipmentFilterKey = 'ALL' | 'BOOKED' | 'IN_TRANSIT' | 'DELIVERED' | 'BOOKING_FAILED' | 'ISSUES' | 'CANCELLED';

const TAB_FILTERS: {
  key: ShipmentFilterKey;
  label: string;
  icon: React.ReactNode;
  route?: string;
  statuses?: ShipmentStatus[];
}[] = [
  { key: 'ALL', label: 'Tất cả', icon: <Package className="w-4 h-4" /> },
  { key: 'BOOKED', label: 'Đã đặt', icon: <Truck className="w-4 h-4" />, route: 'booked', statuses: ['BOOKED'] },
  {
    key: 'IN_TRANSIT',
    label: 'Đang giao',
    icon: <Truck className="w-4 h-4" />,
    route: 'in-transit',
    statuses: ['PICKED_UP', 'IN_TRANSIT'],
  },
  {
    key: 'DELIVERED',
    label: 'Đã giao',
    icon: <CheckCircle className="w-4 h-4" />,
    route: 'delivered',
    statuses: ['DELIVERED'],
  },
  {
    key: 'BOOKING_FAILED',
    label: 'Đặt thất bại',
    icon: <AlertTriangle className="w-4 h-4" />,
    route: 'booking-failed',
    statuses: ['BOOKING_FAILED'],
  },
  {
    key: 'ISSUES',
    label: 'Sự cố',
    icon: <AlertTriangle className="w-4 h-4" />,
    route: 'issues',
    statuses: ['FAILED_DELIVERY', 'RETURNING', 'RETURNED'],
  },
  {
    key: 'CANCELLED',
    label: 'Đã hủy',
    icon: <XCircle className="w-4 h-4" />,
    route: 'cancelled',
    statuses: ['CANCELLED'],
  },
];

function countByStatuses(shipments: Shipment[], statuses?: ShipmentStatus[]): number {
  if (!statuses?.length) return shipments.length;
  const allowed = new Set(statuses);
  return shipments.filter((shipment) => allowed.has(shipment.status)).length;
}

export function ShipmentsListPage() {
  const navigate = useNavigate();
  const { status: routeStatus } = useParams();
  const [page, setPage] = useState(1);

  const { shipments, loading, error, refresh } = useVendorShipments(true);

  const statusFilter = resolveShipmentStatusFilter(routeStatus);
  const activeTab = TAB_FILTERS.find((tab) => tab.route === routeStatus) ?? TAB_FILTERS[0];

  const filteredShipments = useMemo(
    () => filterShipmentsByStatus(shipments, statusFilter),
    [shipments, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const paginatedShipments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredShipments.slice(start, start + PAGE_SIZE);
  }, [filteredShipments, page]);

  useEffect(() => {
    setPage(1);
  }, [routeStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const columns = [
    {
      key: 'subOrderId',
      header: 'Đơn phụ',
      render: (row: Shipment) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">#{row.subOrderId}</p>
          <p className="text-xs text-gray-500">
            {row.shipmentType === 'RETURN' ? 'Hàng hoàn' : 'Giao hàng'} · Vận đơn #{row.id}
          </p>
        </div>
      ),
    },
    {
      key: 'carrier',
      header: 'Đơn vị VC',
      render: (row: Shipment) => (
        <div className="text-sm">
          <p className="text-gray-900 dark:text-gray-100">
            {formatCarrierLabel(row.carrierCode, row.carrierName)}
          </p>
          {row.serviceLevel && (
            <p className="text-xs text-gray-500">{row.serviceLevel}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tracking',
      header: 'Mã vận đơn',
      render: (row: Shipment) => {
        const trackingCode = row.carrierTrackingId || row.externalShipmentId;
        return trackingCode ? (
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
            {trackingCode}
          </code>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row: Shipment) => (
        <span className={`badge badge-${shipmentStatusColor(row.status)}`}>
          {shipmentStatusLabel[row.status]}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      render: (row: Shipment) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateTime(row.updatedAt)}
        </span>
      ),
    },
  ];

  const pageTitle = routeStatus
    ? `Vận đơn — ${activeTab.label}`
    : 'Vận đơn';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi tất cả vận đơn của shop. Nhấn vào dòng để xem chi tiết đơn hàng.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 dark:bg-error-900/20 px-4 py-3 text-sm text-error-700 dark:text-error-300 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} className="btn btn-secondary btn-sm">
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {TAB_FILTERS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          const href = tab.route ? `/shipments/${tab.route}` : '/shipments';
          const count = countByStatuses(shipments, tab.statuses);

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
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-500 truncate">{tab.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {loading ? '—' : count}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" />
      ) : filteredShipments.length === 0 ? (
        <EmptyState
          title="Chưa có vận đơn"
          description={
            statusFilter
              ? 'Không có vận đơn nào khớp bộ lọc này.'
              : 'Vận đơn sẽ xuất hiện sau khi bạn gửi yêu cầu vận chuyển cho đơn phụ.'
          }
          variant="no-data"
          action={
            <button
              type="button"
              onClick={() => navigate('/orders/list')}
              className="btn btn-primary"
            >
              Xem đơn hàng
            </button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginatedShipments}
            keyExtractor={(row) => String(row.id)}
            onRowClick={(row) => navigate(`/orders/${row.subOrderId}`)}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            total={filteredShipments.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
