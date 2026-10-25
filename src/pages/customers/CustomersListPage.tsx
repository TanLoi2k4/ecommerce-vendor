import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingCart, DollarSign } from 'lucide-react';
import { DataTable, Pagination, SearchBar, EmptyState, LoadingSkeleton } from '../../components/ui';
import { useVendorCustomers } from '../../hooks/useVendorCustomers';
import { useCustomerSummary } from '../../hooks/useCustomerSummary';
import { formatCurrency, formatDateTime, getInitials } from '../../utils/helpers';
import type { VendorCustomer } from '../../types/customer';

const SEGMENT_LABELS: Record<string, string> = {
  NEW: 'Mới',
  RETURNING: 'Thường xuyên',
  VIP: 'VIP',
  INACTIVE: 'Không hoạt động',
};

export function CustomersListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastOrderAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, sortOrder]);

  const { result: customers, isLoading, error } = useVendorCustomers({
    page,
    size: 10,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });
  const { data: summary } = useCustomerSummary();

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Khách hàng',
      sortable: true,
      render: (customer: VendorCustomer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-medium">
            {getInitials(customer.name)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</p>
            <p className="text-xs text-gray-500">{customer.phone ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Đơn hàng',
      sortable: true,
      render: (customer: VendorCustomer) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-gray-400" />
          <span>{customer.totalOrders}</span>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Tổng chi tiêu',
      sortable: true,
      render: (customer: VendorCustomer) => (
        <span className="font-semibold text-primary-600">
          {formatCurrency(customer.totalSpent)}
        </span>
      ),
    },
    {
      key: 'lastOrderAt',
      header: 'Đơn gần nhất',
      sortable: true,
      render: (customer: VendorCustomer) => (
        <span className="text-gray-600 dark:text-gray-400">
          {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : 'Không có'}
        </span>
      ),
    },
    {
      key: 'segment',
      header: 'Phân khúc',
      render: (customer: VendorCustomer) =>
        customer.segment ? (
          <span className="badge badge-secondary">
            {SEGMENT_LABELS[customer.segment] ?? customer.segment}
          </span>
        ) : (
          '—'
        ),
    },
  ];

  const allRows = customers?.data ?? [];
  const totalOrdersOnPage = allRows.reduce((sum, c) => sum + c.totalOrders, 0);
  const totalSpentOnPage = allRows.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Khách hàng</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Hồ sơ khách hàng từ analytics-service
          </p>
        </div>
      </div>

      {error && (
        <div className="card p-4 border-l-4 border-error-500 text-error-600 text-sm">{error}</div>
      )}

      {customers && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng khách hàng</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {summary?.totalCustomers ?? customers.total}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
              <ShoppingCart className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Đơn hàng (trang này)</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {totalOrdersOnPage}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
              <DollarSign className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Chi tiêu (trang này)</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalSpentOnPage)}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Doanh thu tích lũy</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(summary?.totalRevenue ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <SearchBar placeholder="Tìm theo tên hoặc số điện thoại..." onSearch={setSearch} className="max-w-md" />

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : customers?.data.length === 0 ? (
        <EmptyState
          title="Không tìm thấy khách hàng"
          description="Khách hàng sẽ xuất hiện ở đây sau khi có đơn hàng hoàn tất tại cửa hàng của bạn"
          variant="no-data"
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={customers?.data || []}
            keyExtractor={(c) => c.customerKeycloakId}
            sortKey={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(c) =>
              navigate(`/customers/${encodeURIComponent(c.customerKeycloakId)}`)
            }
          />
          {customers && (
            <Pagination
              currentPage={page}
              totalPages={customers.totalPages}
              total={customers.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
