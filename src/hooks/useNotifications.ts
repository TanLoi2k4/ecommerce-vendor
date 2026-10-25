import { useCallback, useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';

interface UseNotificationsOptions {
  page?: number;
  size?: number;
  enabled?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { page = 0, size = 20, enabled = true } = options;
  const notifications = useNotificationStore((s) => s.notifications);
  const totalElements = useNotificationStore((s) => s.totalElements);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const loadNotifications = useNotificationStore((s) => s.loadNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearError = useNotificationStore((s) => s.clearError);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await loadNotifications(page, size);
  }, [enabled, loadNotifications, page, size]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    notifications,
    totalElements,
    totalPages: size > 0 ? Math.ceil(totalElements / size) : 0,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  };
}

export function useNotificationUnreadCount(enabled = true) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loadUnreadCount = useNotificationStore((s) => s.loadUnreadCount);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      await loadUnreadCount();
    } finally {
      setIsLoading(false);
    }
  }, [enabled, loadUnreadCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { unreadCount, isLoading, refresh };
}
