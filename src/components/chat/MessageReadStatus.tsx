import { Check, CheckCheck } from 'lucide-react';

interface MessageReadStatusProps {
  isRead: boolean;
  placement?: 'in-bubble' | 'below-bubble';
}

export function MessageReadStatus({
  isRead,
  placement = 'below-bubble',
}: MessageReadStatusProps) {
  const label = isRead ? 'Đã xem' : 'Đã gửi';
  const Icon = isRead ? CheckCheck : Check;

  const className =
    placement === 'in-bubble'
      ? isRead
        ? 'text-sky-200'
        : 'text-white/85'
      : isRead
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-500 dark:text-gray-400';

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium leading-none ${className}`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function OutgoingMessageMeta({
  createdAt,
  isRead,
  placement = 'in-bubble',
  formatTime,
  visible = true,
}: {
  createdAt: string;
  isRead: boolean;
  placement?: 'in-bubble' | 'below-bubble';
  formatTime: (date: string) => string;
  visible?: boolean;
}) {
  if (!visible) return null;

  const timeClass =
    placement === 'in-bubble'
      ? 'text-white/70'
      : 'text-gray-400 dark:text-gray-500';

  return (
    <div className="flex items-center justify-end gap-1.5 mt-1">
      <span className={`text-[11px] tabular-nums ${timeClass}`}>{formatTime(createdAt)}</span>
      <MessageReadStatus isRead={isRead} placement={placement} />
    </div>
  );
}

export function IncomingMessageMeta({
  createdAt,
  formatTime,
  visible = true,
}: {
  createdAt: string;
  formatTime: (date: string) => string;
  visible?: boolean;
}) {
  if (!visible) return null;

  return <p className="text-xs mt-1 text-gray-400">{formatTime(createdAt)}</p>;
}
