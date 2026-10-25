import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationStore } from '../../store';
import { formatRelativeTime, getInitials } from '../../utils/helpers';
import { resolveNotificationLink } from '../../utils/notificationMappers';
import { LoadingSkeleton } from '../ui';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleMobileSidebar } = useUIStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const notificationsLoading = useNotificationStore((s) => s.isLoading);
  const loadNotifications = useNotificationStore((s) => s.loadNotifications);
  const loadUnreadCount = useNotificationStore((s) => s.loadUnreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const unreadCount = useNotificationStore((s) =>
    Math.max(s.unreadCount, s.notifications.filter((n) => !n.isRead).length)
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    void loadNotifications(0, 10);
    void loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleNotificationClick = async (
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
    setShowNotifications(false);
  };

  const handleDeleteNotification = async (
    id: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
    } catch {
      // error handled in store
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
              if (!showNotifications) {
                void loadNotifications(0, 10);
              }
            }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="dropdown w-80 sm:w-96 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Thông báo
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => void markAllAsRead()}
                      className="text-xs text-primary-500 hover:text-primary-600"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="px-4 py-3">
                      <LoadingSkeleton variant="list" count={3} />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      Không có thông báo
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-1 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                          !notif.isRead
                            ? 'bg-primary-50/50 dark:bg-primary-950/20'
                            : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void handleNotificationClick(
                              notif.id,
                              notif.link,
                              notif.metadata,
                              notif.isRead
                            )
                          }
                          className="flex-1 min-w-0 text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notif.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void handleDeleteNotification(notif.id, e)}
                          className="p-2 mr-2 mt-2 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950 shrink-0"
                          aria-label="Xóa thông báo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                {getInitials(user?.name || 'V')}
              </div>
            )}
            <span className="hidden sm:block font-medium text-gray-700 dark:text-gray-300">
              {user?.name}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showProfile && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />
              <div className="dropdown z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={user?.name}>
                    {user?.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={user?.email}>
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    to="/settings/account"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <User className="w-5 h-5" />
                    Tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-950"
                  >
                    <LogOut className="w-5 h-5" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
