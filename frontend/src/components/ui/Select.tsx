import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleStore } from '../../stores';
import { cn } from '../../lib/utils';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
  renderOption?: (option: Option) => ReactNode;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  searchable = false,
  clearable = false,
  className = '',
  renderOption,
}: SelectProps) {
  const { t } = useLocaleStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options by search
  const filteredOptions = searchable && search
    ? options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (option: Option) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "input w-full flex items-center justify-between gap-2 cursor-pointer touch-target text-start",
          error && "input-error",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500 border-blue-500"
        )}
      >
        <span
          className="truncate"
          style={{
            color: selectedOption ? 'var(--color-gray-900)' : 'var(--color-gray-400)',
          }}
        >
          {selectedOption?.label || placeholder || t('common.select', 'Select...')}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Clear button */}
          {clearable && value !== null && !disabled && (
            <span
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              style={{ color: 'var(--color-gray-400)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}

          {/* Chevron */}
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 rounded-xl shadow-xl border overflow-hidden"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('common.search', 'Search...')}
                  className="input h-10 text-sm"
                />
              </div>
            )}

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div
                  className="px-4 py-3 text-center text-sm"
                  style={{ color: 'var(--color-gray-500)' }}
                >
                  {t('common.no_options', 'No options')}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={cn(
                      "w-full px-4 py-3.5 text-start flex items-center justify-between transition-colors text-sm",
                      option.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-zinc-800",
                      option.value === value && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    )}
                  >
                    <span className={cn(option.value !== value && "text-gray-900 dark:text-gray-100")}>
                      {renderOption ? renderOption(option) : option.label}
                    </span>

                    {option.value === value && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
