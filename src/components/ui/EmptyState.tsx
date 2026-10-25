import { type ReactNode } from 'react';
import { Package, Inbox, Search, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'search' | 'no-data' | 'error';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const defaultIcons = {
    default: <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600" />,
    search: <Search className="w-16 h-16 text-gray-300 dark:text-gray-600" />,
    'no-data': <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />,
    error: <FileQuestion className="w-16 h-16 text-gray-300 dark:text-gray-600" />,
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-gray-800">
        {icon || defaultIcons[variant]}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
