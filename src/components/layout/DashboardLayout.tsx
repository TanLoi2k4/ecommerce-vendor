import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore, useNotificationStore } from '../../store';
import { classNames } from '../../utils/helpers';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
  isNotificationSocketConnected,
} from '../../api/notificationSocket';
import { AUTH_TOKEN_KEY, getAuthItem } from '../../utils/authStorage';

const NOTIFICATION_POLL_FALLBACK_MS = 10_000;

export function DashboardLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const addRealtimeNotification = useNotificationStore((s) => s.addRealtimeNotification);
  const loadNotifications = useNotificationStore((s) => s.loadNotifications);

  useEffect(() => {
    connectNotificationSocket(
      () => getAuthItem(AUTH_TOKEN_KEY),
      (dto) => addRealtimeNotification(dto)
    );

    const pollTimer = window.setInterval(() => {
      if (!isNotificationSocketConnected()) {
        void loadNotifications(0, 20).catch(() => undefined);
      }
    }, NOTIFICATION_POLL_FALLBACK_MS);

    return () => {
      window.clearInterval(pollTimer);
      disconnectNotificationSocket();
    };
  }, [addRealtimeNotification, loadNotifications]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div
        className={classNames(
          'min-w-0 transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        )}
      >
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
