/**
 * Checkout Modal Component for POS
 * Payment processing with multiple payment methods
 * Supports offline sales when network is unavailable
 */

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleStore, useCartStore, toast } from '../../stores';
import { useOfflineStore } from '../../stores/offlineStore';
import { Modal, LoadingSpinner, NumericKeypad } from '../ui';
import { FormError } from '../forms';
import { posApi } from '../../lib/apiClient';
import { WifiOff, CreditCard, Banknote, Wallet, Check, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PaymentMethod, CreateSaleData, CartItem } from '../../types';
import type { OfflineSaleInput } from '../../stores/offlineStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saleId: number) => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { t, locale } = useLocaleStore();
  const { cart, getTotals, clearCart } = useCartStore();
  const { isOnline, createOfflineSale } = useOfflineStore();

  const items = cart.items;
  const customer = cart.customer;
  const discount = cart.discount;
  const totals = getTotals();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [payments, setPayments] = useState<{
    method_id: number;
    amount: number;
    reference?: string;
  }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Format currency for LYD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Calculate remaining balance
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, totals.grand_total - paidAmount);
  const change = Math.max(0, paidAmount - totals.grand_total);
  const isComplete = remainingAmount <= 0.001;

  // Load payment methods
  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      setPayments([]);
      setError(null);
      setPaymentAmount('');
    }
  }, [isOpen]);

  // Auto-fill remaining amount when method changes
  useEffect(() => {
    if (selectedMethod && remainingAmount > 0) {
      setPaymentAmount(remainingAmount.toFixed(3));
    }
  }, [selectedMethod, payments.length]); // Depend on payments/method change

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const data = await posApi.paymentMethods();
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedMethod(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Keypad Handlers
  const handleKeyPress = (key: string) => {
    if (key === '.' && paymentAmount.includes('.')) return;
    setPaymentAmount((prev) => {
      // Prevent multiple decimals
      if (key === '.' && prev === '') return '0.';
      // Limit decimals to 3 places
      if (prev.includes('.')) {
        const parts = prev.split('.');
        if (parts[1].length >= 3) return prev;
      }
      return prev + key;
    });
  };

  const handleBackspace = () => {
    setPaymentAmount((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaymentAmount('');
  };

  // Add payment
  const handleAddPayment = () => {
    if (!selectedMethod || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Prevent duplicate method if exact same method is used? 
    // Usually POS allows split payments like Cash part 1, Card part 2.

    setPayments([
      ...payments,
      {
        method_id: selectedMethod,
        amount,
        reference: paymentReference || undefined,
      },
    ]);
    setPaymentAmount('');
    setPaymentReference('');
  };

  // Handles "Enter" on keypad -> Add Payment
  const handleKeypadEnter = () => {
    handleAddPayment();
  };

  // Remove payment
  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  // Process checkout
  const handleCheckout = async () => {
    if (remainingAmount > 0.001) {
      setError(t('pos.insufficient_payment', 'Insufficient payment amount'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Prepare offline sale data
    const offlineSaleData: OfflineSaleInput = {
      items: items.map((item: CartItem) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        tax_amount: 0,
        total: item.unit_price * item.quantity - (item.discount || 0),
      })),
      payments: payments.map((p) => ({
        payment_method_id: p.method_id,
        amount: p.amount,
        reference: p.reference,
      })),
      customer_id: customer?.id,
      subtotal: totals.subtotal,
      discount_amount: totals.discount_amount,
      total: totals.grand_total,
    };

    // Offline check
    if (!isOnline) {
      try {
        await createOfflineSale(offlineSaleData);
        toast.success(t('pos.sale_saved_offline', 'Sale saved offline'));
        clearCart();
        onSuccess(-1);
        return;
      } catch {
        setError(t('error.offline_save_failed', 'Failed to save offline'));
        setIsProcessing(false);
        return;
      }
    }

    try {
      const saleData: CreateSaleData = {
        idempotency_key: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        warehouse_id: 1,
        items: items.map((item: CartItem) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          discount_type: item.discount_type,
        })),
        payments: payments.map((p) => ({
          payment_method_id: p.method_id,
          amount: p.amount,
          reference: p.reference,
        })),
        customer_id: customer?.id,
        discount: discount || undefined,
        discount_type: cart.discount_type,
        notes: cart.notes,
      };

      const result = await posApi.createSale(saleData);
      toast.success(t('pos.sale_complete', 'Sale completed successfully'));
      clearCart();
      onSuccess(result.id);
    } catch (err) {
      if (err instanceof Error && err.message.includes('network')) {
        try {
          await createOfflineSale(offlineSaleData);
          toast.success(t('pos.sale_saved_offline', 'Network error - Sale saved offline'));
          clearCart();
          onSuccess(-1);
        } catch {
          setError(t('error.offline_save_failed', 'Failed to save offline'));
        }
      } else {
        let errorMessage = t('error.checkout_failed', 'Checkout failed');

        if (isAxiosError(err) && err.response) {
          const status = err.response.status;
          const data = err.response.data as any;

          // Use backend message if available and safe
          if (data && data.message && 
              !data.message.includes('SQLSTATE') && 
              !data.message.includes('Exception') &&
              !data.message.includes('trace')) {
            errorMessage = data.message;
          } else if (status === 400) {
            errorMessage = t('error.invalid_request', 'Invalid request. Please check your cart and try again.');
          } else if (status === 422) {
            errorMessage = t('error.validation_failed', 'Validation failed. Please check the entered data.');
          } else if (status === 500) {
            errorMessage = t('error.server_error', 'Server error. Please try again later.');
          }
        } else if (err instanceof Error) {
          // Don't show raw error message if it looks technical
          if (!err.message.includes('status code')) {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodName = (methodId: number) => {
    return paymentMethods.find((m) => m.id === methodId)?.name || 'Unknown';
  };

  const getMethodIcon = (code?: string) => {
    switch (code) {
      case 'cash': return <Banknote className="w-5 h-5" />;
      case 'card': return <CreditCard className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos.checkout', 'Checkout')}
      size="5xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">

          {/* LEFT COLUMN: Payment Selection & Keypad */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden pr-1">

            {/* Offline Alert */}
            {!isOnline && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-800">
                <WifiOff className="h-5 w-5" />
                <span className="text-sm font-medium">{t('pos.offline_mode_active', 'Offline Mode - Local Save')}</span>
              </div>
            )}

            {error && <FormError message={error} />}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('pos.payment_method', 'Payment Method')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-2 rounded-xl border transition-all text-center gap-1",
                      selectedMethod === method.id
                        ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-md transform scale-[1.02]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-400 dark:hover:bg-zinc-700"
                    )}
                  >
                    {getMethodIcon(method.code)}
                    <span className="text-sm font-medium truncate w-full">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('pos.amount_tendered', 'Amount Tendered')}
              </label>
              <div
                className={cn(
                  "relative w-full h-14 bg-white dark:bg-zinc-900 rounded-xl border-2 flex items-center px-4 transition-colors",
                  paymentAmount ? "border-blue-500 shadow-sm" : "border-gray-200 dark:border-zinc-700"
                )}
              >
                <div className="flex-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : <span className="text-gray-300 dark:text-gray-600">0.000</span>}
                </div>
                {paymentAmount && (
                  <button onClick={handleClear} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Keypad */}
            <div className="flex-1">
              <NumericKeypad
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onEnter={handleKeypadEnter}
                showEnter={true}
                className="h-full"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Summary & Payments List */}
          <div className="lg:w-[400px] flex flex-col gap-3 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">

            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {t('pos.summary', 'Summary')}
            </h3>

            {/* Totals Block */}
            <div className="space-y-2 pb-3 border-b border-dashed border-gray-200 dark:border-zinc-700">
              <div className="flex justify-between text-base text-gray-600 dark:text-gray-400">
                <span>{t('pos.subtotal', 'Subtotal')}</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discount_amount > 0 && (
                <div className="flex justify-between text-base text-red-500">
                  <span>{t('pos.discount', 'Discount')}</span>
                  <span>-{formatCurrency(totals.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white pt-2">
                <span>{t('pos.total', 'Total')}</span>
                <span>{formatCurrency(totals.grand_total)}</span>
              </div>
            </div>

            {/* Payments List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[150px] lg:max-h-none">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                  <Wallet className="w-8 h-8 mb-1 opacity-20" />
                  <p className="text-xs italic">{t('pos.no_payments_added', 'No payments added yet')}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {payments.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-600 dark:text-gray-300">
                          {/* Ideally map method code to icon here too */}
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{getMethodName(p.method_id)}</p>
                          {p.reference && <p className="text-[10px] text-gray-500">Ref: {p.reference}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{formatCurrency(p.amount)}</span>
                        <button onClick={() => handleRemovePayment(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Remaining / Change */}
            <div className={cn(
              "p-3 rounded-xl text-center transition-colors",
              isComplete ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
            )}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                {isComplete ? t('pos.change_due', 'Change Due') : t('pos.remaining_balance', 'Remaining Balance')}
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight">
                {formatCurrency(isComplete ? change : remainingAmount)}
              </p>
            </div>

            {/* Complete Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={!isComplete && payments.length === 0 || isProcessing}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all",
                isComplete
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none",
                (payments.length === 0 || isProcessing) && "opacity-50 cursor-not-allowed shadow-none"
              )}
            >
              {isProcessing ? <LoadingSpinner size="sm" className="text-white" /> : <Check className="w-7 h-7" />}
              {t('pos.complete_sale', 'Complete Sale')}
            </motion.button>

          </div>
        </div>
      )}
    </Modal>
  );
}

export default CheckoutModal;
