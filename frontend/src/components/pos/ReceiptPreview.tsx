/**
 * Receipt Preview Component
 * Displays and prints sale receipt with thermal printer support
 * 
 * Thermal Receipt Specifications:
 * - Width: 80mm (288px at 96 DPI)
 * - Font: Monospace (Courier New)
 * - Line width: ~42 characters
 * - Supports QR code for digital receipts
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocaleStore } from '../../stores';
import { salesApi } from '../../lib/apiClient';
import { LoadingSpinner } from '../ui';
import { usePrinter } from '../../hooks/usePrinter';
import { Printer, AlertCircle, QrCode, Wifi, WifiOff } from 'lucide-react';

// Thermal receipt constants
const THERMAL_WIDTH_PX = 288; // 80mm at 96 DPI
const THERMAL_WIDTH_MM = 80;
const MAX_CHARS_PER_LINE = 42;

interface ReceiptPreviewProps {
  saleId: number;
  onClose?: () => void;
  autoPrint?: boolean;
  showQRCode?: boolean;
}

export function ReceiptPreview({
  saleId,
  onClose,
  autoPrint = false,
  showQRCode = true,
}: ReceiptPreviewProps) {
  const { t, direction } = useLocaleStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const { print, printerStatus, isPrinting, pendingCount } = usePrinter();

  const [receiptData, setReceiptData] = useState<{
    html: string;
    invoice_number: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState<boolean | null>(null);

  // Load receipt data
  const loadReceipt = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await salesApi.receipt(saleId);
      setReceiptData(data);
    } catch {
      setError(t('error.load_failed', 'Failed to load receipt'));
    } finally {
      setIsLoading(false);
    }
  }, [saleId, t]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  // Auto-print if enabled
  useEffect(() => {
    if (autoPrint && receiptData && !isLoading) {
      handlePrint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, receiptData, isLoading]);

  // Handle print using the usePrinter hook
  const handlePrint = async () => {
    if (!receiptData) return;
    
    setPrintSuccess(null);
    const success = await print(receiptData.html, receiptData.invoice_number, direction);
    setPrintSuccess(success);
  };

  // Retry loading
  const handleRetry = () => {
    loadReceipt();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div
          className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-error-100)' }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: 'var(--color-error-600)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="mb-4" style={{ color: 'var(--color-error-600)' }}>
          {error}
        </p>
        <button onClick={handleRetry} className="btn btn-secondary btn-sm">
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  if (!receiptData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Printer Status Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm">
          {printerStatus.isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-500" />
          )}
          <span style={{ color: printerStatus.isOnline ? 'var(--color-success-600)' : 'var(--color-warning-600)' }}>
            {printerStatus.isOnline 
              ? t('pos.printer_ready', 'Printer Ready')
              : t('pos.printer_offline', 'Offline Mode')
            }
          </span>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
            {pendingCount} {t('pos.pending_prints', 'pending')}
          </span>
        )}
      </div>

      {/* Receipt preview - 80mm thermal width */}
      <div
        ref={receiptRef}
        className="receipt-preview mx-auto rounded-lg shadow-inner overflow-auto"
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray-200)',
          width: `${THERMAL_WIDTH_PX}px`,
          maxWidth: '100%',
          maxHeight: '400px',
          fontFamily: "'Courier New', 'Lucida Console', Monaco, monospace",
          fontSize: '12px',
          lineHeight: '1.3',
          padding: '8px',
        }}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: receiptData.html }} 
          style={{ 
            maxWidth: `${THERMAL_WIDTH_PX - 16}px`, // Account for padding
          }}
        />
        
        {/* QR Code placeholder */}
        {showQRCode && (
          <div className="receipt-qr text-center mt-4 pt-2 border-t border-dashed border-gray-300">
            <QrCode className="w-16 h-16 mx-auto text-gray-400" />
            <p className="text-xs mt-1 text-gray-500">
              {t('pos.scan_for_digital', 'Scan for digital receipt')}
            </p>
          </div>
        )}
      </div>

      {/* Print status message */}
      {printSuccess === true && (
        <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('pos.print_sent', 'Print job sent')}
        </div>
      )}
      {printSuccess === false && (
        <div className="text-center text-sm text-orange-600 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {t('pos.print_queued', 'Added to print queue')}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onClose && (
          <button onClick={onClose} className="btn btn-secondary flex-1 min-h-[48px]">
            {t('common.close', 'Close')}
          </button>
        )}
        <button 
          onClick={handlePrint} 
          disabled={isPrinting}
          className="btn btn-primary flex-1 min-h-[48px] flex items-center justify-center gap-2"
        >
          {isPrinting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Printer className="w-5 h-5" />
          )}
          {t('pos.print_receipt', 'Print Receipt')}
        </button>
      </div>

      {/* Receipt info */}
      <div className="text-center space-y-1">
        <div
          className="text-sm font-medium"
          style={{ color: 'var(--color-gray-700)' }}
        >
          {t('pos.invoice', 'Invoice')}: {receiptData.invoice_number}
        </div>
        <div
          className="text-xs"
          style={{ color: 'var(--color-gray-400)' }}
        >
          {THERMAL_WIDTH_MM}mm × ~{MAX_CHARS_PER_LINE} {t('pos.chars_per_line', 'chars/line')}
        </div>
      </div>
    </div>
  );
}

export default ReceiptPreview;
