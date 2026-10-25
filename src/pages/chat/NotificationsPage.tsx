import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Trash2,
  Package,
  CreditCard,
  Truck,
  MessageCircle,
  AlertTriangle,
  Info,
  CheckCheck,
} from 'lucide-react';
import { EmptyState, LoadingSkeleton } from '../../components/ui';
import { useNotifications } from '../../hooks/useNotifications';
import { resolveNotificationLink } from '../../utils/notificationMappers';
import { formatRelativeTime } from '../../utils/helpers';
import type { NotificationType } from '../../types/notification';

const TYPE_LABELS: Record<NotificationType, string> = {
  ORDER: 'Đơn hàng',
  PAYMENT: 'Thanh toán',
  SHIPMENT: 'Vận chuyển',
  CHAT: 'Tin nhắn',
  REPORT: 'Báo cáo',
  SYSTEM: 'Hệ thống',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  ORDER: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  PAYMENT: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300',
  SHIPMENT: 'bg-info-100 text-info-700 dark:bg-info-900 dark:text-info-300',
  CHAT: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300',
  REPORT: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300',
  SYSTEM: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  ORDER: <Package className="w-5 h-5 text-primary-500" />,
  PAYMENT: <CreditCard className="w-5 h-5 text-success-500" />,
  SHIPMENT: <Truck className="w-5 h-5 text-info-500" />,
  CHAT: <MessageCircle className="w-5 h-5 text-warning-500" />,
  REPORT: <AlertTriangle className="w-5 h-5 text-error-500" />,
  SYSTEM: <Info className="w-5 h-5 text-gray-500" />,
};

const TAB_TYPES: Array<{ id: string; label: string; types?: NotificationType[] }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'ORDER', label: 'Đơn hàng', types: ['ORDER'] },
  { id: 'PAYMENT', label: 'Thanh toán', types: ['PAYMENT'] },
  { id: 'SHIPMENT', label: 'Vận chuyển', types: ['SHIPMENT'] },
  { id: 'CHAT', label: 'Tin nhắn', types: ['CHAT'] },
  { id: 'REPORT', label: 'Báo cáo', types: ['REPORT'] },
  { id: 'SYSTEM', label: 'Hệ thống', types: ['SYSTEM'] },
];

const PAGE_SIZE = 50;

export function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotifications({ page: 0, size: PAGE_SIZE });

  useEffect(() => {
    if (error) clearError();
  }, [error, clearError]);

  const tabs = TAB_TYPES.map((tab) => ({
    ...tab,
    count:
      tab.id === 'all'
        ? notifications.length
        : notifications.filter((n) => tab.types?.includes(n.type)).length,
  }));

  const activeTypes = TAB_TYPES.find((t) => t.id === activeTab)?.types;
  const filtered =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => activeTypes?.includes(n.type));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = async (
    id: number,
    link?: string,
    metadata?: Record<string, unknown>,
    isRead?: boolean
  ) => {
    if (!isRead) {
      try {
        await markAsRead(id);
      } catch {
        return;
      }
    }
    const route = resolveNotificationLink(link, metadata);
    if (route) navigate(route);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
    } catch {
      // error handled in store
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Thông báo
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Cập nhật đơn hàng, thanh toán, vận chuyển và tin nhắn
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="btn btn-sm btn-ghost self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm">
          {error}
        </div>
      )}

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-12 h-12" />}
            title="Không có thông báo"
            description={
              activeTab === 'all'
                ? 'Thông báo mới sẽ xuất hiện tại đây'
                : `Không có thông báo loại ${TAB_TYPES.find((t) => t.id === activeTab)?.label ?? ''}`
            }
            variant="no-data"
          />
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                !notif.isRead
                  ? 'bg-primary-50/30 dark:bg-primary-950/10 border-l-4 border-l-primary-500'
                  : ''
              }`}
            >
              <div className="flex-shrink-0 mt-1">{TYPE_ICONS[notif.type]}</div>
              <button
                type="button"
                onClick={() =>
                  void handleOpen(notif.id, notif.link, notif.metadata, notif.isRead)
                }
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[notif.type]}`}
                  >
                    {TYPE_LABELS[notif.type]}
                  </span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  )}
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                  {notif.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {notif.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatRelativeTime(notif.createdAt)}
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => void handleDelete(notif.id, e)}
                disabled={deletingId === notif.id}
                className="p-2 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950 shrink-0"
                aria-label="Xóa thông báo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
