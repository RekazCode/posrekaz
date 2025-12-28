import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocaleStore } from '../../stores';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
  className = '',
  autoFocus = false,
  onClear,
}: SearchInputProps) {
  const { t, direction } = useLocaleStore();
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced change handler
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Clear handler
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          [direction === 'rtl' ? 'right' : 'left']: '0.75rem',
          color: 'var(--color-gray-400)',
        }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder || t('common.search', 'Search...')}
        autoFocus={autoFocus}
        className="input touch-manipulation"
        style={{
          paddingInlineStart: '3rem',
          paddingInlineEnd: localValue ? '3.5rem' : '1rem',
        }}
        role="searchbox"
        aria-label={placeholder || t('common.search', 'Search')}
      />

      {/* Clear button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 active:bg-gray-200 dark:active:bg-zinc-700 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            [direction === 'rtl' ? 'left' : 'right']: '0.25rem',
            color: 'var(--color-gray-500)',
          }}
          aria-label={t('common.clear', 'Clear search')}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
