import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber, getGrowthColor } from '../../utils/helpers';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  growth?: number;
  growthLabel?: string;
  comparison?: ReactNode;
  suffix?: string;
  prefix?: string;
  isLoading?: boolean;
}

export function DashboardCard({
  title,
  value,
  icon,
  growth,
  growthLabel = 'so với kỳ trước',
  comparison,
  suffix,
  prefix,
  isLoading,
}: DashboardCardProps) {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-8 w-32" />
          </div>
          <div className="skeleton h-12 w-12 rounded-lg" />
        </div>
      </div>
    );
  }

  const displayValue = typeof value === 'number' ? formatNumber(value) : value;
  const growthColor = growth !== undefined ? getGrowthColor(growth) : '';
  const GrowthIcon = growth && growth > 0 ? TrendingUp : growth && growth < 0 ? TrendingDown : Minus;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {prefix}
            {displayValue}
            {suffix}
          </p>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${growthColor}`}>
              <GrowthIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {growth > 0 ? '+' : ''}
                {growth.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">{growthLabel}</span>
            </div>
          )}
          {comparison && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{comparison}</p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 text-primary-500 dark:text-primary-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
