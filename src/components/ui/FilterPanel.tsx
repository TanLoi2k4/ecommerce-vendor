import { X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  filters: {
    key: string;
    label: string;
    type: 'select' | 'date' | 'date-range';
    options?: FilterOption[];
    placeholder?: string;
  }[];
  values: Record<string, string | [string, string]>;
  onChange: (key: string, value: string | [string, string]) => void;
  onClear: () => void;
  onApply?: () => void;
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  onApply,
}: FilterPanelProps) {
  const hasFilters = Object.values(values).some((v) =>
    Array.isArray(v) ? v.some(Boolean) : Boolean(v)
  );

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {filter.label}
          </label>
          {filter.type === 'select' && (
            <select
              value={(values[filter.key] as string) || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="">{filter.placeholder || 'Tất cả'}</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {filter.type === 'date' && (
            <input
              type="date"
              value={(values[filter.key] as string) || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="input min-w-[140px]"
            />
          )}
          {filter.type === 'date-range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={(values[filter.key] as [string, string])?.[0] || ''}
                onChange={(e) =>
                  onChange(filter.key, [
                    e.target.value,
                    (values[filter.key] as [string, string])?.[1] || '',
                  ])
                }
                className="input min-w-[140px]"
              />
              <span className="text-gray-400">đến</span>
              <input
                type="date"
                value={(values[filter.key] as [string, string])?.[1] || ''}
                onChange={(e) =>
                  onChange(filter.key, [
                    (values[filter.key] as [string, string])?.[0] || '',
                    e.target.value,
                  ])
                }
                className="input min-w-[140px]"
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2 ml-auto">
        {hasFilters && (
          <button
            onClick={onClear}
            className="btn btn-ghost btn-sm text-gray-600 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
            Xóa
          </button>
        )}
        {onApply && (
          <button onClick={onApply} className="btn btn-primary btn-sm">
            Áp dụng bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
