import type { ReactNode } from 'react';
import { useLocaleStore } from '../../stores';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) {
  const { direction } = useLocaleStore();

  return (
    <div className="mb-4" dir={direction}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--color-gray-700)' }}
      >
        {label}
        {required && (
          <span className="ms-1" style={{ color: 'var(--color-error-500)' }}>
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-gray-500)' }}>
          {hint}
        </p>
      )}

      {error && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
