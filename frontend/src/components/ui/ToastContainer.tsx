/**
 * Toast notifications component
 * Displays toast messages from uiStore
 */

import { useUIStore } from '../../stores';
import { useLocaleStore } from '../../stores';

const typeStyles = {
  success: {
    bg: 'var(--color-success-50)',
    border: 'var(--color-success-500)',
    text: 'var(--color-success-600)',
    icon: '✓',
  },
  error: {
    bg: 'var(--color-error-50)',
    border: 'var(--color-error-500)',
    text: 'var(--color-error-600)',
    icon: '✕',
  },
  warning: {
    bg: 'var(--color-warning-50)',
    border: 'var(--color-warning-500)',
    text: 'var(--color-warning-600)',
    icon: '⚠',
  },
  info: {
    bg: 'var(--color-primary-50)',
    border: 'var(--color-primary-500)',
    text: 'var(--color-primary-600)',
    icon: 'ℹ',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  const { direction } = useLocaleStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-50 flex flex-col gap-2 p-4"
      style={{
        bottom: '1rem',
        [direction === 'rtl' ? 'left' : 'right']: '1rem',
        maxWidth: '24rem',
      }}
      dir={direction}
    >
      {toasts.map((toast) => {
        const styles = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 animate-slide-in"
            style={{
              backgroundColor: styles.bg,
              borderColor: styles.border,
            }}
            role="alert"
          >
            <span
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-sm font-bold"
              style={{
                backgroundColor: styles.border,
                color: 'white',
              }}
            >
              {styles.icon}
            </span>
            <p
              className="flex-1 text-sm"
              style={{ color: styles.text }}
            >
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-black/5"
              style={{ color: styles.text }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
