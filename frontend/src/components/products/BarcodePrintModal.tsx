/**
 * Barcode Print Modal Component
 * Generates and prints barcode stickers using browser print functionality
 * 
 * Features:
 * - Supports Code128 (default) and EAN-13 (for 13-digit barcodes)
 * - Print-friendly CSS layout for thermal label printers
 * - Quantity selector for multiple stickers
 * - Uses window.print() for browser-based printing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JsBarcode from 'jsbarcode';
import { useLocaleStore } from '../../stores';
import type { Product } from '../../types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

// Determine barcode format based on barcode string
function getBarcodeFormat(barcode: string): string {
  // EAN-13 for 13-digit numeric barcodes
  if (/^\d{13}$/.test(barcode)) {
    return 'EAN13';
  }
  // EAN-8 for 8-digit numeric barcodes
  if (/^\d{8}$/.test(barcode)) {
    return 'EAN8';
  }
  // Default to CODE128 for all other cases (most flexible)
  return 'CODE128';
}

export function BarcodePrintModal({ isOpen, onClose, product }: BarcodePrintModalProps) {
  const { t, direction } = useLocaleStore();
  const [quantity, setQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const barcodeRefs = useRef<(SVGSVGElement | null)[]>([]);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  // Generate barcodes when modal opens or quantity changes
  useEffect(() => {
    if (isOpen && product?.barcode) {
      // Small delay to ensure refs are attached
      const timer = setTimeout(() => {
        generateBarcodes();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, product?.barcode, quantity]);

  const generateBarcodes = useCallback(() => {
    if (!product?.barcode) return;

    const format = getBarcodeFormat(product.barcode);
    
    barcodeRefs.current.forEach((svg) => {
      if (svg) {
        try {
          JsBarcode(svg, product.barcode!, {
            format,
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5,
            background: '#ffffff',
            lineColor: '#000000',
          });
        } catch (error) {
          console.error('Barcode generation error:', error);
          // Fallback to CODE128 if specific format fails
          try {
            JsBarcode(svg, product.barcode!, {
              format: 'CODE128',
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 12,
              margin: 5,
              background: '#ffffff',
              lineColor: '#000000',
            });
          } catch (fallbackError) {
            console.error('Fallback barcode generation error:', fallbackError);
          }
        }
      }
    });
  }, [product?.barcode]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount) + ' ' + t('currency.lyd', 'LYD');
  };

  // Handle print
  const handlePrint = useCallback(() => {
    if (!product?.barcode) return;

    setIsPrinting(true);

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Print Barcode - ${product.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
          }
          
          .sticker-container {
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
            padding: 2mm;
          }
          
          .sticker {
            width: 48mm;
            min-height: 28mm;
            padding: 2mm;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .product-name {
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2mm;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .barcode-svg {
            max-width: 44mm;
            height: auto;
          }
          
          .product-price {
            font-size: 8pt;
            margin-top: 1mm;
            color: #333;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .sticker {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="sticker-container">
          ${Array(quantity).fill(null).map(() => `
            <div class="sticker">
              <div class="product-name">${escapeHtml(product.name)}</div>
              <svg class="barcode-svg" id="barcode-print"></svg>
              ${showPrice ? `<div class="product-price">${formatCurrency(product.price)}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <script>
          document.querySelectorAll('.barcode-svg').forEach(function(svg) {
            try {
              JsBarcode(svg, "${escapeJs(product.barcode)}", {
                format: "${getBarcodeFormat(product.barcode)}",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 5,
                background: '#ffffff',
                lineColor: '#000000'
              });
            } catch(e) {
              JsBarcode(svg, "${escapeJs(product.barcode)}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 5,
                background: '#ffffff',
                lineColor: '#000000'
              });
            }
          });
          
          setTimeout(function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }, 300);
        </script>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      // Popup was blocked - try using an iframe instead
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();
        
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }
    }

    setIsPrinting(false);
    onClose();
  }, [product, quantity, showPrice, formatCurrency, onClose, t]);

  // Escape HTML for safe rendering
  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Escape JS string
  function escapeJs(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
  }

  if (!product) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="barcode-modal-title"
          dir={direction}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-base)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <h2
                id="barcode-modal-title"
                className="text-lg font-semibold"
                style={{ color: 'var(--color-gray-900)' }}
              >
                {t('products.print_barcode', 'Print Barcode')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minHeight: '48px', minWidth: '48px' }}
                aria-label={t('common.close', 'Close')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="text-center">
                <h3 className="font-medium text-lg" style={{ color: 'var(--color-gray-900)' }}>
                  {product.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-gray-500)' }}>
                  {t('products.barcode', 'Barcode')}: {product.barcode}
                </p>
              </div>

              {/* Barcode Preview */}
              <div
                className="p-4 rounded-lg border-2 border-dashed flex flex-col items-center"
                style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-subtle)' }}
              >
                <p className="text-xs mb-2" style={{ color: 'var(--color-gray-500)' }}>
                  {t('products.barcode_preview', 'Preview')}
                </p>
                <div className="bg-white p-3 rounded shadow-sm">
                  <svg
                    ref={(el) => { barcodeRefs.current[0] = el; }}
                    className="barcode-preview"
                  />
                  <p className="text-center text-sm font-medium mt-2">{product.name}</p>
                  {showPrice && (
                    <p className="text-center text-xs mt-1" style={{ color: 'var(--color-gray-600)' }}>
                      {formatCurrency(product.price)}
                    </p>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <label className="font-medium" style={{ color: 'var(--color-gray-700)' }}>
                    {t('products.quantity', 'Quantity')}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'var(--color-border-default)', minHeight: '48px', minWidth: '48px' }}
                      disabled={quantity <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      className="w-16 h-12 text-center border rounded-lg font-medium"
                      style={{ borderColor: 'var(--color-border-default)' }}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(100, quantity + 1))}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'var(--color-border-default)', minHeight: '48px', minWidth: '48px' }}
                      disabled={quantity >= 100}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Show Price Toggle */}
                <div className="flex items-center justify-between">
                  <label className="font-medium" style={{ color: 'var(--color-gray-700)' }}>
                    {t('products.show_price', 'Show Price')}
                  </label>
                  <button
                    onClick={() => setShowPrice(!showPrice)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      showPrice ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                    style={{ 
                      backgroundColor: showPrice ? 'var(--color-primary-600)' : 'var(--color-gray-300)',
                      minHeight: '48px',
                      minWidth: '48px',
                      padding: '10px',
                    }}
                    role="switch"
                    aria-checked={showPrice}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        showPrice ? 'translate-x-5' : 'translate-x-0'
                      }`}
                      style={{ top: '14px', left: showPrice ? 'auto' : '14px', right: showPrice ? '14px' : 'auto' }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-subtle)' }}
            >
              <button
                onClick={onClose}
                className="btn btn-secondary px-6"
                style={{ minHeight: '48px' }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handlePrint}
                disabled={isPrinting || !product.barcode}
                className="btn btn-primary px-6 flex items-center gap-2"
                style={{ minHeight: '48px' }}
              >
                {isPrinting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.printing', 'Printing...')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {t('products.print', 'Print')} ({quantity})
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Hidden iframe for printing */}
          <iframe
            ref={printFrameRef}
            style={{ display: 'none' }}
            title="Print Frame"
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default BarcodePrintModal;
