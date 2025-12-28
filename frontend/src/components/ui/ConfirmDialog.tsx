import { Modal } from './Modal';
import { useLocaleStore } from '../../stores';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useLocaleStore();
  const resolvedConfirmText = confirmText || confirmLabel;

  const buttonStyles: Record<string, { bg: string; hover: string }> = {
    danger: { bg: 'var(--color-error-600)', hover: 'var(--color-error-700)' },
    warning: { bg: 'var(--color-warning-600)', hover: 'var(--color-warning-700)' },
    primary: { bg: 'var(--color-primary-600)', hover: 'var(--color-primary-700)' },
  };

  const icons: Record<string, string> = {
    danger: '⚠️',
    warning: '⚡',
    primary: 'ℹ️',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {cancelText || t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn text-white"
            style={{ backgroundColor: buttonStyles[variant].bg }}
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              resolvedConfirmText || t('common.confirm', 'Confirm')
            )}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{
            backgroundColor:
              variant === 'danger'
                ? 'var(--color-error-50)'
                : variant === 'warning'
                ? 'var(--color-warning-50)'
                : 'var(--color-primary-50)',
          }}
        >
          {icons[variant]}
        </div>
        <p style={{ color: 'var(--color-gray-600)' }}>{message}</p>
      </div>
    </Modal>
  );
}
