import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '../../utils/helpers';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  defaultValue?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  placeholder = 'Tìm kiếm...',
  onSearch,
  defaultValue = '',
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(value);
  }, [value, debouncedSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 pr-10"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
