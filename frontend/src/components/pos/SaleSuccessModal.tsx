/**
 * Sale Success Modal Component
 * Shows sale completion with receipt preview and print options
 */

import { useState, useMemo } from 'react';
import { useLocaleStore } from '../../stores';
import { Modal } from '../ui';
import { ReceiptPreview } from './ReceiptPreview';

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
  onNewSale?: () => void;
}

export function SaleSuccessModal({
  isOpen,
  onClose,
  saleId,
  onNewSale,
}: SaleSuccessModalProps) {
  const { t } = useLocaleStore();
  const [showReceipt, setShowReceipt] = useState(false);

  // Reset state when modal opens/closes
  const modalKey = useMemo(() => `${saleId}-${isOpen}`, [saleId, isOpen]);
  const [lastModalKey, setLastModalKey] = useState(modalKey);

  if (modalKey !== lastModalKey) {
    setLastModalKey(modalKey);
    setShowReceipt(false);
  }

  // Handle new sale
  const handleNewSale = () => {
    onClose();
    onNewSale?.();
  };

  // If no saleId, don't render
  if (!saleId) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showReceipt ? t('pos.receipt', 'Receipt') : t('pos.sale_complete', 'Sale Complete')}
      size={showReceipt ? 'md' : 'sm'}
    >
      {showReceipt ? (
        <ReceiptPreview
          saleId={saleId}
          onClose={() => setShowReceipt(false)}
        />
      ) : (
        <div className="text-center py-6">
          {/* Success icon */}
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-success-100)' }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: 'var(--color-success-600)' }}
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
            </svg>
          </div>

          {/* Thank you message */}
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-gray-900)' }}
          >
            {t('pos.thank_you', 'Thank You!')}
          </h3>
          <p
            className="text-lg mb-6"
            style={{ color: 'var(--color-gray-600)' }}
          >
            {t('pos.sale_complete_message', 'Sale has been completed successfully.')}
          </p>

          {/* Sale ID display */}
          <div
            className="inline-block px-4 py-2 rounded-lg mb-6"
            style={{ backgroundColor: 'var(--color-gray-100)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              {t('pos.sale_id', 'Sale ID')}
            </span>
            <span
              className="block text-xl font-mono font-bold"
              style={{ color: 'var(--color-primary-600)' }}
            >
              #{saleId}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Receipt options row */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReceipt(true)}
                className="btn btn-secondary flex-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t('pos.view_receipt', 'View Receipt')}
              </button>
              <button
                onClick={() => {
                  setShowReceipt(true);
                  // Print will be triggered by autoPrint in ReceiptPreview
                }}
                className="btn btn-secondary flex-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                {t('pos.print_receipt', 'Print Receipt')}
              </button>
            </div>

            {/* New sale button - prominent */}
            <button
              onClick={handleNewSale}
              className="btn btn-primary w-full text-lg font-semibold"
              style={{ minHeight: '48px' }}
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {t('pos.new_sale', 'New Sale')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SaleSuccessModal;
