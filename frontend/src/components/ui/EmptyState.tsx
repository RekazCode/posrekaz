import type { ReactNode } from 'react';
import { useLocaleStore } from '../../stores';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { direction } = useLocaleStore();
  
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      dir={direction}
    >
      {icon && (
        <div
          className="mb-4 p-4 rounded-full"
          style={{ backgroundColor: 'var(--color-gray-100)' }}
        >
          <span className="text-4xl">{icon}</span>
        </div>
      )}
      <h3
        className="text-lg font-medium mb-2"
        style={{ color: 'var(--color-gray-900)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm mb-4 max-w-md"
          style={{ color: 'var(--color-gray-500)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
