import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: {
    bg: 'var(--color-gray-100)',
    text: 'var(--color-gray-700)',
    dot: 'var(--color-gray-500)',
  },
  primary: {
    bg: 'var(--color-primary-100)',
    text: 'var(--color-primary-700)',
    dot: 'var(--color-primary-500)',
  },
  success: {
    bg: 'var(--color-success-50)',
    text: 'var(--color-success-600)',
    dot: 'var(--color-success-500)',
  },
  warning: {
    bg: 'var(--color-warning-50)',
    text: 'var(--color-warning-600)',
    dot: 'var(--color-warning-500)',
  },
  danger: {
    bg: 'var(--color-error-50)',
    text: 'var(--color-error-600)',
    dot: 'var(--color-error-500)',
  },
  info: {
    bg: '#e0f2fe',
    text: '#0369a1',
    dot: '#0ea5e9',
  },
};

const sizeStyles: Record<BadgeSize, { padding: string; fontSize: string }> = {
  sm: { padding: '0.125rem 0.5rem', fontSize: '0.75rem' },
  md: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
};

export function Badge({ children, variant = 'default', size = 'sm', dot = false, className = '' }: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: styles.dot }}
        />
      )}
      {children}
    </span>
  );
}
