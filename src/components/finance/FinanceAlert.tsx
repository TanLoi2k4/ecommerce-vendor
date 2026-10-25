import { AlertCircle, Info } from 'lucide-react';
import { classNames } from '../../utils/helpers';
import type { ReactNode } from 'react';

interface FinanceAlertProps {
  tone?: 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
}

const TONE_CLASS = {
  error: 'border-error-500',
  warning: 'border-warning-500',
  info: 'border-primary-500',
};

const ICON_CLASS = {
  error: 'text-error-600',
  warning: 'text-warning-600',
  info: 'text-primary-600',
};

export function FinanceAlert({ tone = 'info', title, children }: FinanceAlertProps) {
  const Icon = tone === 'info' ? Info : AlertCircle;

  return (
    <div className={classNames('card flex items-start gap-3 border-l-4 p-4', TONE_CLASS[tone])}>
      <Icon className={classNames('mt-0.5 h-5 w-5 shrink-0', ICON_CLASS[tone])} />
      <div className="min-w-0 text-sm text-gray-600 dark:text-gray-400">
        {title && <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>}
        <div className={title ? 'mt-0.5' : undefined}>{children}</div>
      </div>
    </div>
  );
}
