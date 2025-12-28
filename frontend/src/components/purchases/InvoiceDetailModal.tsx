/**
 * Purchase Invoice Detail Modal
 * View invoice details and record payments
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, LoadingSpinner, Badge, CurrencyInput } from '../ui';
import { FormField } from '../forms';
import { purchasesApi } from '../../lib/apiClient';
import type { PurchaseInvoiceWithItems, PaymentStatus } from '../../types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
  onPaymentRecorded?: () => void;
}

export function InvoiceDetailModal({ isOpen, onClose, invoiceId, onPaymentRecorded }: InvoiceDetailModalProps) {
  const { t, locale } = useLocaleStore();

  // State
  const [invoice, setInvoice] = useState<PurchaseInvoiceWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Format currency
  const formatCurrency = useCallback((amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(numAmount);
  }, [locale]);

  // Load invoice
  useEffect(() => {
    if (!isOpen || !invoiceId) return;

    const loadInvoice = async () => {
      setIsLoading(true);
      try {
        const data = await purchasesApi.get(invoiceId);
        setInvoice(data);
        // Set default payment amount to remaining balance
        const remaining = Number(data.total) - Number(data.paid_amount);
        setPaymentAmount(remaining > 0 ? remaining : 0);
      } catch {
        toast.error(t('error.load_failed', 'Failed to load invoice'));
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [isOpen, invoiceId, t, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setInvoice(null);
      setShowPaymentForm(false);
      setPaymentAmount(0);
      setPaymentNotes('');
    }
  }, [isOpen]);

  // Payment status badge
  const getPaymentBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'warning' | 'success'> = {
      unpaid: 'default',
      partial: 'warning',
      paid: 'success',
    };
    const labels: Record<PaymentStatus, string> = {
      unpaid: t('purchases.unpaid', 'Unpaid'),
      partial: t('purchases.partial_paid', 'Partial'),
      paid: t('purchases.paid', 'Paid'),
    };
    return <Badge variant={variants[status]} dot>{labels[status]}</Badge>;
  };

  // Handle record payment
  const handleRecordPayment = async () => {
    if (!invoice || paymentAmount <= 0) return;

    setIsRecordingPayment(true);
    try {
      const updatedInvoice = await purchasesApi.recordPayment(invoice.id, {
        amount: paymentAmount,
        notes: paymentNotes || undefined,
      });
      
      setInvoice({
        ...invoice,
        paid_amount: updatedInvoice.paid_amount,
        payment_status: updatedInvoice.payment_status,
      });
      
      toast.success(t('purchases.payment_recorded', 'Payment recorded successfully'));
      setShowPaymentForm(false);
      setPaymentNotes('');
      
      // Update remaining
      const remaining = Number(updatedInvoice.total) - Number(updatedInvoice.paid_amount);
      setPaymentAmount(remaining > 0 ? remaining : 0);
      
      onPaymentRecorded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('error.action_failed', 'Failed to record payment'));
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Calculate remaining
  const remainingAmount = invoice ? Number(invoice.total) - Number(invoice.paid_amount) : 0;
  const canRecordPayment = invoice && invoice.payment_status !== 'paid';

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('purchases.invoice_details', 'Invoice Details')}>
        <div className="py-12">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('purchases.invoice', 'Invoice')} ${invoice.invoice_number}`}
      size="lg"
    >
      {/* Header info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
        <div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.supplier', 'Supplier')}</div>
          <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>{invoice.supplier?.name}</div>
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.payment', 'Payment')}</div>
          <div className="mt-1">{getPaymentBadge(invoice.payment_status)}</div>
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.date', 'Date')}</div>
          <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {new Date(invoice.invoice_date).toLocaleDateString(locale)}
          </div>
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.total', 'Total')}</div>
          <div className="font-semibold" style={{ color: 'var(--color-primary-600)' }}>
            {formatCurrency(invoice.total)}
          </div>
        </div>
      </div>

      {/* Supplier invoice reference */}
      {invoice.supplier_invoice_number && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <span className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('purchases.supplier_invoice', 'Supplier Invoice #')}:{' '}
          </span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {invoice.supplier_invoice_number}
          </span>
        </div>
      )}

      {/* Items */}
      <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: 'var(--color-gray-200)' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <tr>
              <th className="px-4 py-2 text-start">{t('products.name', 'Product')}</th>
              <th className="px-4 py-2 text-center">{t('purchases.qty', 'Qty')}</th>
              <th className="px-4 py-2 text-end">{t('purchases.unit_cost', 'Unit Cost')}</th>
              <th className="px-4 py-2 text-end">{t('purchases.subtotal', 'Subtotal')}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item) => (
              <tr key={item.id} className="border-t" style={{ borderColor: 'var(--color-gray-100)' }}>
                <td className="px-4 py-2">
                  <div style={{ color: 'var(--color-gray-900)' }}>{item.product?.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>{item.product?.sku}</div>
                </td>
                <td className="px-4 py-2 text-center" style={{ color: 'var(--color-gray-600)' }}>
                  {item.quantity}
                </td>
                <td className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                  {formatCurrency(item.unit_cost)}
                </td>
                <td className="px-4 py-2 text-end font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ backgroundColor: 'var(--color-gray-50)' }}>
            {invoice.discount_amount > 0 && (
              <tr className="border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
                <td colSpan={3} className="px-4 py-2 text-end">{t('common.discount', 'Discount')}:</td>
                <td className="px-4 py-2 text-end" style={{ color: 'var(--color-danger-600)' }}>
                  -{formatCurrency(invoice.discount_amount)}
                </td>
              </tr>
            )}
            {invoice.shipping_cost > 0 && (
              <tr className="border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
                <td colSpan={3} className="px-4 py-2 text-end">{t('common.shipping', 'Shipping')}:</td>
                <td className="px-4 py-2 text-end">{formatCurrency(invoice.shipping_cost)}</td>
              </tr>
            )}
            <tr className="border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
              <td colSpan={3} className="px-4 py-3 text-end font-semibold">
                {t('common.total', 'Total')}:
              </td>
              <td className="px-4 py-3 text-end font-bold" style={{ color: 'var(--color-primary-600)' }}>
                {formatCurrency(invoice.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment summary */}
      <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
        <h4 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
          {t('purchases.payment_summary', 'Payment Summary')}
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-gray-600)' }}>{t('purchases.total_amount', 'Total Amount')}:</span>
            <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-gray-600)' }}>{t('purchases.paid_amount', 'Paid Amount')}:</span>
            <span className="font-medium" style={{ color: 'var(--color-success-600)' }}>{formatCurrency(invoice.paid_amount)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
            <span className="font-medium" style={{ color: 'var(--color-gray-700)' }}>{t('purchases.remaining', 'Remaining')}:</span>
            <span 
              className="font-bold"
              style={{ color: remainingAmount > 0 ? 'var(--color-danger-600)' : 'var(--color-success-600)' }}
            >
              {formatCurrency(remainingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment form */}
      {showPaymentForm && (
        <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: 'var(--color-primary-200)', backgroundColor: 'var(--color-primary-50)' }}>
          <h4 className="font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
            {t('purchases.record_payment', 'Record Payment')}
          </h4>
          <div className="space-y-4">
            <FormField label={t('purchases.payment_amount', 'Payment Amount')} required>
              <CurrencyInput
                value={paymentAmount}
                onChange={(val) => setPaymentAmount(val ?? 0)}
                min={0.001}
                max={remainingAmount}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-gray-500)' }}>
                {t('purchases.max_payment', 'Maximum')}: {formatCurrency(remainingAmount)}
              </p>
            </FormField>
            <FormField label={t('purchases.payment_notes', 'Notes')}>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="input"
                rows={2}
                placeholder={t('purchases.payment_notes_placeholder', 'Optional payment notes...')}
              />
            </FormField>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="btn btn-secondary"
                disabled={isRecordingPayment}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleRecordPayment}
                className="btn btn-primary"
                disabled={isRecordingPayment || paymentAmount <= 0 || paymentAmount > remainingAmount}
              >
                {isRecordingPayment ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ms-2">{t('common.saving', 'Saving...')}</span>
                  </>
                ) : (
                  t('purchases.record_payment', 'Record Payment')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <div className="text-sm mb-1" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.notes', 'Notes')}</div>
          <div style={{ color: 'var(--color-gray-700)' }} className="whitespace-pre-wrap">{invoice.notes}</div>
        </div>
      )}

      {/* Stock update notice */}
      <div 
        className="mb-6 p-3 rounded-lg border flex items-center gap-2"
        style={{ 
          backgroundColor: 'var(--color-success-50)', 
          borderColor: 'var(--color-success-200)' 
        }}
      >
        <svg className="w-5 h-5" style={{ color: 'var(--color-success-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--color-success-800)' }}>
          {t('purchases.stock_updated', 'Inventory stock was updated when this invoice was created.')}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
        {canRecordPayment && !showPaymentForm && (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="btn btn-success"
          >
            <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('purchases.record_payment', 'Record Payment')}
          </button>
        )}

        <button onClick={onClose} className="btn btn-secondary ms-auto">
          {t('common.close', 'Close')}
        </button>
      </div>
    </Modal>
  );
}

export default InvoiceDetailModal;
