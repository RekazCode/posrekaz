import type { ReactNode } from 'react';
import { useLocaleStore } from '../../stores';

interface FormActionsProps {
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export function FormActions({
  onCancel,
  submitLabel,
  cancelLabel,
  isSubmitting = false,
  disabled = false,
  children,
}: FormActionsProps) {
  const { t } = useLocaleStore();

  return (
    <div
      className="flex items-center justify-end gap-3 pt-4 mt-4 border-t"
      style={{ borderColor: 'var(--color-gray-200)' }}
    >
      {children}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          {cancelLabel || t('common.cancel', 'Cancel')}
        </button>
      )}

      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className="btn btn-primary"
      >
        {isSubmitting ? (
          <>
            <span className="spinner" />
            {t('common.saving', 'Saving...')}
          </>
        ) : (
          submitLabel || t('common.save', 'Save')
        )}
      </button>
    </div>
  );
}
