/** Mirrors communication-service NotificationType enum. */
export type NotificationType =
  | 'ORDER'
  | 'PAYMENT'
  | 'SHIPMENT'
  | 'CHAT'
  | 'REPORT'
  | 'SYSTEM';

/** Raw DTO from communication-service NotificationResponse. */
export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  link?: string | null;
  metadata?: string | null;
  /** Jackson may serialize Lombok `isRead` as `read`. */
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

/** UI model used across Header and NotificationsPage. */
export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
