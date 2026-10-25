import { create } from 'zustand';
import * as notificationApi from '../api/notificationApi';
import type { NotificationDto, NotificationItem } from '../types/notification';
import { mapNotificationDto } from '../utils/notificationMappers';
import { getApiErrorMessage } from '../utils/apiErrors';
import { toast } from '../components/ui/Toast';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  totalElements: number;
  isLoading: boolean;
  error: string | null;
  loadNotifications: (page?: number, size?: number) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  addRealtimeNotification: (dto: NotificationDto) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  totalElements: 0,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadNotifications: async (page = 0, size = 20) => {
    set({ isLoading: true, error: null });
    try {
      const [pageData, apiUnreadCount] = await Promise.all([
        notificationApi.getNotifications(page, size),
        notificationApi.getUnreadCount().catch(() => null),
      ]);
      const items = (pageData?.content ?? []).map(mapNotificationDto);
      const localUnread = items.filter((n) => !n.isRead).length;
      set({
        notifications: items,
        totalElements: pageData?.totalElements ?? items.length,
        unreadCount: apiUnreadCount ?? localUnread,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error, 'Không thể tải thông báo'),
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Badge is non-critical — keep last known count
    }
  },

  markAsRead: async (id: number) => {
    const prev = get().notifications;
    const wasUnread = prev.find((n) => n.id === id && !n.isRead);
    set({
      notifications: prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: wasUnread ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
    });
    try {
      await notificationApi.markNotificationRead(id);
    } catch (error) {
      set({ notifications: prev });
      if (wasUnread) {
        set({ unreadCount: get().unreadCount + 1 });
      }
      set({ error: getApiErrorMessage(error, 'Không thể đánh dấu đã đọc') });
      throw error;
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications;
    set({
      notifications: prev.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
    try {
      await notificationApi.markAllNotificationsRead();
    } catch (error) {
      set({ notifications: prev });
      void get().loadUnreadCount();
      set({ error: getApiErrorMessage(error, 'Không thể đánh dấu tất cả đã đọc') });
      throw error;
    }
  },

  deleteNotification: async (id: number) => {
    const prev = get().notifications;
    const removed = prev.find((n) => n.id === id);
    set({
      notifications: prev.filter((n) => n.id !== id),
      totalElements: Math.max(0, get().totalElements - 1),
      unreadCount:
        removed && !removed.isRead
          ? Math.max(0, get().unreadCount - 1)
          : get().unreadCount,
    });
    try {
      await notificationApi.deleteNotification(id);
    } catch (error) {
      set({ notifications: prev, totalElements: get().totalElements + 1 });
      if (removed && !removed.isRead) {
        set({ unreadCount: get().unreadCount + 1 });
      }
      set({ error: getApiErrorMessage(error, 'Không thể xóa thông báo') });
      throw error;
    }
  },

  addRealtimeNotification: (dto: NotificationDto) => {
    const item = mapNotificationDto(dto);
    const { notifications, unreadCount } = get();
    if (notifications.some((n) => n.id === item.id)) return;
    set({
      notifications: [item, ...notifications].slice(0, 50),
      unreadCount: item.isRead ? unreadCount : unreadCount + 1,
      totalElements: get().totalElements + 1,
    });
    if (!item.isRead) {
      toast.info(`${item.title}: ${item.content}`);
    }
  },
}));
