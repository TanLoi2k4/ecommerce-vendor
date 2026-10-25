import type { ReactNode } from 'react';

interface FinancePageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function FinancePageHeader({ title, subtitle, actions }: FinancePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
