import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocaleStore, useCartStore } from '../../stores';
import { Badge } from '../ui';
import type { CartItem } from '../../types';

interface CartPanelProps {
  onCheckout: () => void;
  onHold: () => void;
  onClear: () => void;
  onRecall: () => void;
  hasHeldSales: boolean;
}

export function CartPanel({
  onCheckout,
  onHold,
  onClear,
  onRecall,
  hasHeldSales,
}: CartPanelProps) {
  const { t, locale } = useLocaleStore();
  const {
    cart,
    getTotals,
    updateQuantity,
    removeItem,
    setCartDiscount,
    setCustomer,
  } = useCartStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = cart.items;
  const customer = cart.customer;
  const discount = cart.discount;
  const totals = getTotals();

  // Auto-scroll to bottom when items are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items.length]);

  // Format currency for LYD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Generate live region announcement text
  const liveAnnouncement = items.length === 0 
    ? t('pos.cart_empty', 'Cart is empty')
    : `${items.length} ${t('pos.items', 'items')}, ${t('pos.total', 'Total')}: ${formatCurrency(totals.grand_total)}`;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-s border-gray-200 dark:border-zinc-800" role="region" aria-label={t('pos.cart', 'Cart')}>
      {/* Screen reader live region for cart updates */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {liveAnnouncement}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-gray-100">
            {t('pos.cart', 'Cart')}
          </h2>
          {items.length > 0 && (
            <Badge variant="primary" className="text-sm px-2.5 py-1">{items.length}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasHeldSales && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onRecall}
              className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 active:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              title={t('pos.recall', 'Recall Held Sale')}
              aria-label={t('pos.recall', 'Recall Held Sale')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </motion.button>
          )}
          {items.length > 0 && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onHold}
                className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title={t('pos.hold', 'Hold Sale')}
                aria-label={t('pos.hold', 'Hold Sale')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClear}
                className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title={t('pos.clear', 'Clear Cart')}
                aria-label={t('pos.clear', 'Clear Cart')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Customer (optional) */}
      {customer && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {customer.name}
            </span>
          </div>
          <button
            onClick={() => setCustomer(null)}
            className="min-h-[44px] min-w-[44px] text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wide px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors touch-manipulation"
            aria-label={`${t('common.remove', 'Remove')} ${customer.name}`}
          >
            {t('common.remove', 'Remove')}
          </button>
        </div>
      )}

      {/* Cart items */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-4xl grayscale">
              🛒
            </div>
            <p className="font-medium text-lg text-gray-900 dark:text-gray-100">
              {t('pos.empty_cart', 'Cart is empty')}
            </p>
            <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
              {t('pos.empty_cart_hint', 'Scan a barcode or select products from the grid')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            <AnimatePresence initial={false}>
              {items.map((item: CartItem) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                  onRemove={() => removeItem(item.id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Totals Section */}
      <div className="bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-800 p-5 space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t('pos.subtotal', 'Subtotal')}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>

        {/* Discount */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('pos.discount', 'Discount')}
            </span>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={discount || ''}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0, 'percentage')}
                className="w-16 pl-2 pr-6 py-1 text-center font-medium rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
            </div>
          </div>
          <span className="text-red-500 font-medium">
            -{formatCurrency(totals.discount_amount)}
          </span>
        </div>

        {/* Total Divider */}
        <div className="border-t border-dashed border-gray-300 dark:border-zinc-700 my-2"></div>

        {/* Grand Total */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            {t('pos.total', 'Total')}
          </span>
          <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
            {formatCurrency(totals.grand_total)}
          </span>
        </div>

        {/* Checkout Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full h-[72px] min-h-[72px] flex items-center justify-between bg-gray-900 dark:bg-white text-white dark:text-black py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-gray-800 dark:hover:bg-zinc-200 active:bg-gray-950 dark:active:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all mt-4 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={items.length > 0 ? `${t('pos.checkout', 'Checkout')} ${formatCurrency(totals.grand_total)}` : t('pos.checkout', 'Checkout')}
        >
          <span className="text-lg sm:text-xl">{t('pos.checkout', 'Checkout')}</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums">{items.length > 0 && formatCurrency(totals.grand_total)}</span>
        </motion.button>
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  formatCurrency: (amount: number) => string;
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  formatCurrency,
}: CartItemRowProps) {
  const { t } = useLocaleStore();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 min-h-[72px] bg-white dark:bg-zinc-900 group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base mb-1">
          {item.product.name}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tabular-nums">
          {formatCurrency(item.unit_price)}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white dark:bg-zinc-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:bg-gray-100 dark:active:bg-zinc-600 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('common.decrease', 'Decrease quantity')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </motion.button>

        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
          className="w-12 h-11 text-center text-base font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-gray-100 tabular-nums"
          aria-label={t('common.quantity', 'Quantity')}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 shadow-sm text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-700 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('common.increase', 'Increase quantity')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>

      {/* Line total & Actions */}
      <div className="flex flex-col items-end gap-1 min-w-[80px]">
        <p className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {formatCurrency(item.unit_price * item.quantity)}
        </p>

        <button
          onClick={onRemove}
          className="min-h-[32px] text-xs text-red-500 hover:text-red-700 dark:text-red-400 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation"
          aria-label={`Remove ${item.product.name}`}
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}

export default CartPanel;
