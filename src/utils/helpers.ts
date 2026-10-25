import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CURRENCY } from './constants';

export function formatCurrency(amount: number): string {
  return `${CURRENCY} ${amount.toLocaleString('vi-VN')}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/** Parse API date values: ISO strings, PostgreSQL timestamps, or Unix epoch (seconds/ms). */
export function parseApiDate(value: string | number | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    // Backend may serialize Instant as epoch seconds (~10 digits).
    const ms = Math.abs(value) < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }

  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
    return new Date(ms);
  }

  const isoParsed = parseISO(trimmed);
  if (isValid(isoParsed)) {
    return isoParsed;
  }

  // e.g. "2026-07-30 09:00:00+00"
  const normalized = trimmed.includes(' ') && !trimmed.includes('T')
    ? trimmed.replace(' ', 'T')
    : trimmed;
  return new Date(normalized);
}

/** Normalize API/WebSocket date payloads to ISO string for consistent storage. */
export function normalizeApiDateString(value: unknown): string {
  if (value == null || value === '') {
    return new Date().toISOString();
  }

  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number') {
      const ms = value[0] * 1000 + Math.floor((value[1] as number) / 1e6);
      const date = new Date(ms);
      if (isValid(date)) return date.toISOString();
    }
    if (value.length >= 3 && typeof value[0] === 'number') {
      const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value as number[];
      const date = new Date(
        Date.UTC(year, month - 1, day, hour, minute, second, Math.floor(nano / 1e6))
      );
      if (isValid(date)) return date.toISOString();
    }
  }

  const dateObj = parseApiDate(value as string | number | Date);
  if (!isValid(dateObj)) return new Date().toISOString();
  return dateObj.toISOString();
}

/** Format message timestamp with date when not today (dd/MM/yyyy HH:mm). */
export function formatMessageTime(date: string | number | Date): string {
  const dateObj = parseApiDate(date);
  if (!isValid(dateObj)) return '-';

  const time = format(dateObj, 'HH:mm', { locale: vi });
  const now = new Date();
  const isToday =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate();

  if (isToday) return time;
  return `${format(dateObj, 'dd/MM/yyyy', { locale: vi })} ${time}`;
}

export function formatDate(
  date: string | number | Date,
  formatStr: string = 'dd MMM yyyy'
): string {
  const dateObj = parseApiDate(date);
  if (!isValid(dateObj)) return '-';
  return format(dateObj, formatStr, { locale: vi });
}

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_YEAR_MONTH = /^(\d{4})-(\d{2})$/;

/** Chart labels from APIs use ISO dates; show them as Vietnamese day/month/year. */
export function formatChartDateLabel(value: unknown): string {
  const label = typeof value === 'string' ? value : String(value ?? '');
  const dateMatch = ISO_DATE_ONLY.exec(label);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}/${month}/${year}`;
  }
  const monthMatch = ISO_YEAR_MONTH.exec(label);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    return `${month}/${year}`;
  }
  return label;
}

export function formatDateTime(date: string | number | Date): string {
  return formatDate(date, 'dd MMM yyyy HH:mm');
}

export function formatRelativeTime(date: string | number | Date): string {
  const dateObj = parseApiDate(date);
  if (!isValid(dateObj)) return '-';
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function generateSKU(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase();
  const colors: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error',
    returned: 'error',
    active: 'success',
    inactive: 'gray',
    draft: 'gray',
    paid: 'success',
    failed: 'error',
    refunded: 'gray',
    upcoming: 'primary',
    ended: 'gray',
    expired: 'error',
    completed: 'success',
  };
  return colors[normalized] || 'gray';
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateDiscount(
  originalPrice: number,
  discountedPrice: number
): number {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number
): { data: T[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, total, totalPages };
}

export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  if (!search) return items;
  const lowerSearch = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearch);
      }
      return false;
    })
  );
}

export function sortBy<T>(
  items: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }
    return order === 'asc' ? comparison : -comparison;
  });
}

export function getGrowthColor(value: number): string {
  if (value > 0) return 'text-success-600';
  if (value < 0) return 'text-error-600';
  return 'text-gray-500';
}

export function getGrowthIcon(value: number): 'up' | 'down' | 'neutral' {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}
