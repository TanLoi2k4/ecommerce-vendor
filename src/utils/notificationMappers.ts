import type {
  NotificationDto,
  NotificationItem,
  NotificationType,
} from '../types/notification';

const NOTIFICATION_TYPES: NotificationType[] = [
  'ORDER',
  'PAYMENT',
  'SHIPMENT',
  'CHAT',
  'REPORT',
  'SYSTEM',
];

function parseMetadata(raw?: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore invalid JSON
  }
  return undefined;
}

function resolveNotificationIsRead(dto: {
  isRead?: boolean;
  read?: boolean;
}): boolean {
  return Boolean(dto.isRead ?? dto.read ?? false);
}

export function mapNotificationDto(dto: NotificationDto): NotificationItem {
  const type = NOTIFICATION_TYPES.includes(dto.type) ? dto.type : 'SYSTEM';
  const metadata = parseMetadata(dto.metadata);
  return {
    id: dto.id,
    type,
    title: dto.title,
    content: dto.content,
    link: resolveNotificationLink(dto.link, metadata),
    metadata,
    isRead: resolveNotificationIsRead(dto),
    createdAt: dto.createdAt,
  };
}

export function parseNotificationPayload(payload: unknown): {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  link?: string | null;
  metadata?: string | null;
  isRead: boolean;
  createdAt: string;
} | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.id !== 'number' || typeof raw.title !== 'string') return null;
  return {
    id: raw.id,
    type: (typeof raw.type === 'string' ? raw.type : 'SYSTEM') as NotificationType,
    title: raw.title,
    content: String(raw.content ?? ''),
    link: raw.link != null ? String(raw.link) : null,
    metadata: raw.metadata != null ? String(raw.metadata) : null,
    isRead: Boolean(raw.isRead ?? raw.read ?? false),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

/** Normalize backend link to an in-app vendor route. */
export function resolveNotificationLink(
  link?: string | null,
  metadata?: Record<string, unknown>
): string | undefined {
  const subOrderId = asNumber(metadata?.subOrderId);
  const reportId = asNumber(metadata?.reportId);
  const roomCode =
    typeof metadata?.roomCode === 'string' ? metadata.roomCode : undefined;

  if (link) {
    const hashSubOrder = link.match(/#suborder-(\d+)/i);
    if (hashSubOrder) {
      return `/orders/${hashSubOrder[1]}`;
    }

    if (link.startsWith('/orders/') && subOrderId != null) {
      const tail = link.slice('/orders/'.length);
      if (!/^\d+$/.test(tail)) {
        return `/orders/${subOrderId}`;
      }
    }

    if (link.startsWith('/')) {
      if (link === '/questions') {
        return roomCode ? `/chat?room=${encodeURIComponent(roomCode)}` : '/chat';
      }
      if (link === '/chat' && roomCode) {
        return `/chat?room=${encodeURIComponent(roomCode)}`;
      }
      if (link === '/reports' || link.startsWith('/reports/')) {
        if (reportId != null && link === '/reports') {
          return `/reports/${reportId}`;
        }
        return link;
      }
      return link;
    }

    try {
      const url = new URL(link, window.location.origin);
      return resolveNotificationLink(url.pathname + url.search, metadata);
    } catch {
      return link.startsWith('/') ? link : `/${link}`;
    }
  }

    if (subOrderId != null) return `/orders/${subOrderId}`;
    if (reportId != null) return `/reports/${reportId}`;
    if (roomCode) return `/chat?room=${encodeURIComponent(roomCode)}`;
    return undefined;
}
