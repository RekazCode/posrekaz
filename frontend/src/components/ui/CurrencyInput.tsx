import { useState, useRef, useMemo, useCallback } from 'react';
import { useLocaleStore } from '../../stores';

interface CurrencyInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  min?: number;
  max?: number;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  min,
  max,
  className = '',
}: CurrencyInputProps) {
  const { locale, direction } = useLocaleStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Currency settings (LYD with 3 decimals)
  const currency = useMemo(() => ({
    code: 'LYD',
    symbol: locale === 'ar' ? 'د.ل' : 'LYD',
    decimals: 3,
  }), [locale]);

  // Format number for display
  const formatCurrency = useCallback((num: number | null): string => {
    if (num === null || isNaN(num)) return '';
    return num.toFixed(currency.decimals);
  }, [currency.decimals]);

  // Parse string to number
  const parseValue = useCallback((str: string): number | null => {
    const cleaned = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }, []);

  // Derive display value from props (not as state)
  // Use state only for tracking what user is currently typing
  const [typingValue, setTypingValue] = useState<string | null>(null);
  
  // Display value: when focused and typing, show what user typed; otherwise show formatted value
  const displayValue = isFocused && typingValue !== null 
    ? typingValue 
    : formatCurrency(value);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTypingValue(raw);

    const parsed = parseValue(raw);
    if (parsed !== null) {
      // Apply min/max
      let bounded = parsed;
      if (min !== undefined && parsed < min) bounded = min;
      if (max !== undefined && parsed > max) bounded = max;
      onChange(bounded);
    } else if (raw === '' || raw === '-') {
      onChange(null);
    }
  };

  // Format on blur
  const handleBlur = () => {
    setIsFocused(false);
    setTypingValue(null); // Clear typing state, will show formatted value
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number on focus
    if (value !== null) {
      setTypingValue(value.toString());
    } else {
      setTypingValue('');
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', '-'];
    if (allowedKeys.includes(e.key)) return;

    // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

    // Allow: home, end, left, right
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    // Block non-numeric
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Currency symbol */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none font-medium"
        style={{
          [direction === 'rtl' ? 'right' : 'left']: '0.75rem',
          color: 'var(--color-gray-500)',
        }}
      >
        {currency.symbol}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || `0.${'0'.repeat(currency.decimals)}`}
        disabled={disabled}
        dir="ltr" // Numbers always LTR
        className={`input ${error ? 'input-error' : ''}`}
        style={{
          paddingInlineStart: '3.5rem',
          textAlign: direction === 'rtl' ? 'left' : 'right',
        }}
      />

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
