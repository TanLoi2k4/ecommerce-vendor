import api from './client';
import type { PageResponse } from '../types/api';
import type { NotificationDto } from '../types/notification';

export async function getNotifications(page = 0, size = 20) {
  const res = await api.get<PageResponse<NotificationDto>>('/notifications', {
    params: { page, size },
  });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<number>('/notifications/unread-count');
  const count = res.data;
  if (typeof count === 'number' && !Number.isNaN(count)) return count;
  const parsed = Number(count);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function markNotificationRead(id: number): Promise<NotificationDto> {
  const res = await api.put<NotificationDto>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
