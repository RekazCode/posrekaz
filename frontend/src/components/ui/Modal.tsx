import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleStore } from '../../stores';
import { useFocusTrap } from '../../hooks';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  position?: 'center' | 'bottom'; // Added for bottom sheet support
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full mx-4',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  position = 'center',
}: ModalProps) {
  const { direction, t } = useLocaleStore();

  // Use focus trap hook for accessibility
  const { containerRef: focusTrapRef } = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    initialFocus: true,
    returnFocus: true,
  });

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Body scroll lock and escape key handler
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // responsive handling: force bottom sheet on mobile if desired, 
  // currently controlling via prop or could be CSS media query based inside variants

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: position === 'bottom'
      ? { y: "100%", opacity: 0 }
      : { scale: 0.95, opacity: 0 },
    visible: position === 'bottom'
      ? { y: 0, opacity: 1 }
      : { scale: 1, opacity: 1 },
    exit: position === 'bottom'
      ? { y: "100%", opacity: 0 }
      : { scale: 0.95, opacity: 0 }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex p-4 ${position === 'bottom' ? 'items-end sm:items-center' : 'items-center'} justify-center`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          dir={direction}
        >
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
          />

          {/* Modal Content */}
          <motion.div
            ref={focusTrapRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
              relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full flex flex-col
              ${sizeStyles[size]} 
              ${position === 'bottom' ? 'max-h-[85vh] rounded-b-none sm:rounded-b-xl' : 'max-h-[90vh]'}
            `}
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: 'var(--color-border-subtle)',
              borderWidth: '1px'
            }}
          >
            {/* Handle bar for bottom sheet mobile feel */}
            {position === 'bottom' && (
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
              </div>
            )}

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <h2
                id="modal-title"
                className="text-lg font-semibold text-start"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors touch-target hover:bg-gray-100 dark:hover:bg-zinc-800"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label={t('common.close', 'Close')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex items-center justify-end gap-3 px-6 py-4 border-t"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
