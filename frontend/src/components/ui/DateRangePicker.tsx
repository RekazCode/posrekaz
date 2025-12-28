import { useState, useRef, useEffect } from 'react';
import { useLocaleStore } from '../../stores';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  maxDate?: Date;
  minDate?: Date;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  maxDate,
  minDate,
  className = '',
}: DateRangePickerProps) {
  const { t, locale, direction } = useLocaleStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format date for input
  const formatDateInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Parse date from input
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  };

  // Display value
  const displayValue = (() => {
    if (!value.start && !value.end) {
      return placeholder || t('common.select_dates', 'Select dates...');
    }
    if (value.start && !value.end) {
      return `${formatDate(value.start)} - ...`;
    }
    if (!value.start && value.end) {
      return `... - ${formatDate(value.end)}`;
    }
    return `${formatDate(value.start)} - ${formatDate(value.end)}`;
  })();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle start date change
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = parseDate(e.target.value);
    onChange({ ...value, start });
  };

  // Handle end date change
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = parseDate(e.target.value);
    onChange({ ...value, end });
  };

  // Clear dates
  const handleClear = () => {
    onChange({ start: null, end: null });
  };

  // Preset ranges
  const presets = [
    {
      label: t('date.today', 'Today'),
      getValue: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { start: today, end: today };
      },
    },
    {
      label: t('date.yesterday', 'Yesterday'),
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return { start: yesterday, end: yesterday };
      },
    },
    {
      label: t('date.last_7_days', 'Last 7 days'),
      getValue: () => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      },
    },
    {
      label: t('date.last_30_days', 'Last 30 days'),
      getValue: () => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      },
    },
    {
      label: t('date.this_month', 'This month'),
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        return { start, end };
      },
    },
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`input w-full flex items-center gap-2 cursor-pointer ${
          error ? 'input-error' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
      >
        {/* Calendar icon */}
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--color-gray-400)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <span
          className="flex-1 truncate"
          style={{
            color:
              value.start || value.end
                ? 'var(--color-gray-900)'
                : 'var(--color-gray-400)',
          }}
        >
          {displayValue}
        </span>

        {/* Clear button */}
        {(value.start || value.end) && !disabled && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 rounded hover:bg-gray-200"
            style={{ color: 'var(--color-gray-400)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-20 mt-1 bg-white rounded-lg shadow-lg border p-4"
          style={{
            borderColor: 'var(--color-gray-200)',
            minWidth: '300px',
            [direction === 'rtl' ? 'right' : 'left']: 0,
          }}
        >
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b" style={{ borderColor: 'var(--color-gray-100)' }}>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.getValue());
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-sm rounded-lg border transition-colors hover:bg-gray-50"
                style={{
                  borderColor: 'var(--color-gray-200)',
                  color: 'var(--color-gray-700)',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-gray-700)' }}
              >
                {t('date.start', 'Start')}
              </label>
              <input
                type="date"
                value={formatDateInput(value.start)}
                onChange={handleStartChange}
                max={formatDateInput(value.end || maxDate || undefined)}
                min={formatDateInput(minDate || undefined)}
                className="input py-2"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-gray-700)' }}
              >
                {t('date.end', 'End')}
              </label>
              <input
                type="date"
                value={formatDateInput(value.end)}
                onChange={handleEndChange}
                min={formatDateInput(value.start || minDate || undefined)}
                max={formatDateInput(maxDate || undefined)}
                className="input py-2"
              />
            </div>
          </div>

          {/* Apply button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-primary py-2"
            >
              {t('common.apply', 'Apply')}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
