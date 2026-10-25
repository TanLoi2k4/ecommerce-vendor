import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const config = {
  success: {
    className:
      'bg-success-50 border-success-200 text-success-800 dark:bg-success-900 dark:border-success-700 dark:text-success-200',
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
  },
  error: {
    className:
      'bg-error-50 border-error-200 text-error-800 dark:bg-error-900 dark:border-error-700 dark:text-error-200',
    icon: <XCircle className="w-5 h-5 shrink-0" />,
  },
  warning: {
    className:
      'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900 dark:border-warning-700 dark:text-warning-200',
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
  },
  info: {
    className:
      'bg-secondary-50 border-secondary-200 text-secondary-800 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-200',
    icon: <Info className="w-5 h-5 shrink-0" />,
  },
};

const toastStore: {
  toasts: Toast[];
  listeners: Set<() => void>;
  add: (type: ToastType, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
} = {
  toasts: [],
  listeners: new Set(),
  add(type, message, duration) {
    const toast: Toast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      message,
      duration,
    };
    toastStore.toasts.push(toast);
    toastStore.listeners.forEach((listener) => listener());
  },
  dismiss(id) {
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    toastStore.listeners.forEach((listener) => listener());
  },
};

/** Callable outside React (e.g. axios interceptors). */
export const toast = {
  success: (message: string, duration?: number) => toastStore.add('success', message, duration),
  error: (message: string, duration?: number) => toastStore.add('error', message, duration),
  warning: (message: string, duration?: number) => toastStore.add('warning', message, duration),
  info: (message: string, duration?: number) => toastStore.add('info', message, duration),
};

function ToastItem({
  toast: item,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { type, message, duration = 5000 } = item;
  const { className, icon } = config[type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), duration);
    return () => clearTimeout(timer);
  }, [item.id, duration, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up ${className}`}
    >
      {icon}
      <span className="flex-1 text-sm">{message}</span>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="p-1 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>(toastStore.toasts);

  useEffect(() => {
    const listener = () => setToasts([...toastStore.toasts]);
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    dismissToast: toastStore.dismiss,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  };
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
}
