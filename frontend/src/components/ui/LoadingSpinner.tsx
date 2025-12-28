import { useLocaleStore } from '../../stores';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  message?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export function LoadingSpinner({ size = 'md', fullPage = false, message, className = '', ...props }: LoadingSpinnerProps) {
  const { t } = useLocaleStore();

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} {...props}>
      <div
        className={`${sizeClasses[size]} rounded-full animate-spin`}
        style={{
          borderColor: 'var(--color-gray-300)',
          borderTopColor: 'var(--color-primary-600)',
        }}
      />
      {message && (
        <p style={{ color: 'var(--color-gray-600)' }}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        role="status"
        aria-label={t('common.loading', 'Loading...')}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
