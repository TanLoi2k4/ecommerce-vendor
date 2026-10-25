import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  BarChart3,
  Wallet,
  MessageCircle,
  Store,
  Truck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Flag,
  Bell,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { getInitials, classNames } from '../../utils/helpers';

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
}

/** Known sub-routes under /products — must not activate "Tất cả sản phẩm". */
const PRODUCT_SUB_SEGMENTS = new Set(['add', 'reviews']);

const navItems: NavItem[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Hồ sơ cửa hàng', icon: Store, path: '/shop' },
  {
    label: 'Sản phẩm',
    icon: Package,
    children: [
      { label: 'Tất cả sản phẩm', path: '/products' },
      { label: 'Thêm sản phẩm', path: '/products/add' },
      { label: 'Tồn kho', path: '/inventory' },
      { label: 'Đánh giá', path: '/products/reviews' },
    ],
  },
  {
    label: 'Đơn hàng',
    icon: ShoppingCart,
    children: [
      { label: 'Tổng quan đơn hàng', path: '/orders' },
      { label: 'Danh sách đơn hàng', path: '/orders/list' },
      { label: 'Trả hàng & hoàn tiền', path: '/orders/returns' },
    ],
  },
  { label: 'Vận chuyển', icon: Truck, path: '/shipments' },
  { label: 'Khách hàng', icon: Users, path: '/customers' },
  { label: 'Flash Sale', icon: Megaphone, path: '/marketing/flash-sales' },
  {
    label: 'Phân tích',
    icon: BarChart3,
    children: [
      { label: 'Phân tích doanh số', path: '/analytics/sales' },
      { label: 'Phân tích sản phẩm', path: '/analytics/products' },
      { label: 'Phân tích khách hàng', path: '/analytics/customers' },
    ],
  },
  {
    label: 'Tài chính',
    icon: Wallet,
    children: [
      { label: 'Ví & rút tiền', path: '/finance/wallet' },
      { label: 'Thu nhập chờ', path: '/finance/payables' },
      { label: 'Hóa đơn phí sàn', path: '/finance/invoices' },
      { label: 'Báo cáo doanh thu', path: '/finance/revenue' },
    ],
  },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'Báo cáo', icon: Flag, path: '/reports' },
  { label: 'Thông báo', icon: Bell, path: '/notifications' },
];

interface SidebarProps {
  mobile?: boolean;
}

export function Sidebar({ mobile = false }: SidebarProps) {
  const location = useLocation();
  const { user, shop } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setMobileSidebarOpen } = useUIStore();
  const collapsed = !mobile && sidebarCollapsed;
  const [expandedItems, setExpandedItems] = useState<string[]>(['Sản phẩm', 'Đơn hàng']);

  /** Prefix match for expanding parent groups (not for child link highlight). */
  const matchesPath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  /**
   * Child highlight: list roots match exact + detail IDs,
   * but not sibling filter/sub-routes (e.g. /orders/returns, /products/add).
   */
  const isChildActive = (path: string) => {
    const { pathname } = location;
    if (pathname === path) return true;

    if (path === '/orders') {
      return false;
    }

    if (path === '/orders/list') {
      if (pathname.startsWith('/orders/list')) return true;
      const seg = pathname.match(/^\/orders\/([^/]+)/)?.[1];
      return !!seg && /^\d+$/.test(seg);
    }

    if (path === '/products') {
      const seg = pathname.match(/^\/products\/([^/]+)/)?.[1];
      return !!seg && !PRODUCT_SUB_SEGMENTS.has(seg);
    }

    return pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    navItems.forEach((item) => {
      const hasActiveChild = item.children?.some((child) => matchesPath(child.path));
      if (hasActiveChild) {
        setExpandedItems((prev) =>
          prev.includes(item.label) ? prev : [...prev, item.label]
        );
      }
    });
  }, [location.pathname]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const closeMobile = () => {
    if (mobile) setMobileSidebarOpen(false);
  };

  return (
    <aside
      className={classNames(
        'flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800',
        mobile
          ? 'relative h-full w-72'
          : 'fixed left-0 top-0 z-50 h-screen',
        !mobile && (sidebarCollapsed ? 'w-20' : 'w-72')
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        {!collapsed ? (
          <Link to="/dashboard" className="group flex items-center gap-3" onClick={closeMobile}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 transition-shadow group-hover:shadow-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-base font-bold leading-tight text-transparent">
                Avora
              </span>
              <span className="text-xs leading-tight text-gray-500 dark:text-gray-400">
                Cổng Nhà Bán
              </span>
            </div>
          </Link>
        ) : (
          <Link to="/dashboard" className="mx-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 transition-shadow hover:shadow-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
          </Link>
        )}
        {mobile && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {!mobile && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      )}

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.includes(item.label);
          const hasChildren = !!item.children;
          const activeChild = item.children?.some((child) => matchesPath(child.path));

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(item.label)}
                  className={classNames('sidebar-link w-full text-sm', activeChild && 'active')}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={classNames(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </>
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.path!}
                  end={item.path === '/dashboard'}
                  onClick={closeMobile}
                  className={({ isActive: navActive }) =>
                    classNames('sidebar-link text-sm', navActive && 'active')
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )}

              {hasChildren && isExpanded && !collapsed && (
                <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={
                        child.path === '/orders' ||
                        child.path === '/orders/list' ||
                        child.path === '/products'
                      }
                      onClick={closeMobile}
                      className={() =>
                        classNames(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          isChildActive(child.path)
                            ? 'font-medium text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className={classNames('flex items-center gap-3', collapsed && 'justify-center')}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 font-semibold text-primary-600 dark:bg-primary-900 dark:text-primary-400">
              {getInitials(user?.name || 'V')}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{shop?.name}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
