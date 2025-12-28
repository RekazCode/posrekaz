/**
 * Point of Sale Page - Full implementation
 * Touch-optimized fullscreen POS interface with offline support
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocaleStore, useCartStore, toast } from '../stores';
import { useOfflineStore } from '../stores/offlineStore';
import { ProductGrid, CartPanel, CheckoutModal, SaleSuccessModal } from '../components/pos';
import type { ProductGridHandle } from '../components/pos/ProductGrid';
import { Modal } from '../components/ui';
import { OfflineIndicator } from '../components/offline';
import { usePOSShortcuts, useBarcodeScanner } from '../hooks';
import { posApi } from '../lib/apiClient';
import type { POSProduct, HeldCart } from '../types';

export function POSPage() {
  const { t, locale } = useLocaleStore();
  const { cart, addItem, clearCart, holdCart, recallCart, heldCarts, deleteHeldCart } = useCartStore();
  const { isOnline, pendingCount } = useOfflineStore();

  // Refs for search focus and product refresh
  const searchInputRef = useRef<HTMLInputElement>(null);
  const productGridRef = useRef<ProductGridHandle>(null);

  // State
  const [showCheckout, setShowCheckout] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [products, setProducts] = useState<POSProduct[]>([]);

  // Load products for barcode scanning
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await posApi.products();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products for barcode scanner:', err);
      }
    };
    loadProducts();
  }, []);

  // Handle barcode scan - instant add to cart
  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find(
      (p) => p.barcode === barcode || p.sku === barcode
    );
    
    if (product) {
      addItem(product, 1);
      // Check if product already in cart to show appropriate message
      const existingItem = cart.items.find(item => item.product.id === product.id);
      if (existingItem) {
        toast.success(t('pos.quantity_increased', 'Quantity increased'));
      } else {
        toast.success(t('pos.item_added', 'Item added to cart'));
      }
    } else {
      toast.error(t('pos.product_not_found', 'Product not found: ') + barcode);
    }
  }, [products, addItem, cart.items, t]);

  // Barcode scanner hook - active when no modal is open
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showCheckout && !showClearConfirm && !showHeldSales && !showSuccessModal && !showShortcutsHelp,
    minLength: 3,
  });

  // Handle product selection
  const handleProductSelect = (product: POSProduct) => {
    addItem(product, 1);
    toast.success(t('pos.item_added', 'Item added to cart'));
  };

  // Hold current sale
  const handleHold = useCallback(() => {
    if (cart.items.length === 0) {
      toast.warning(t('pos.cart_empty', 'Cart is empty'));
      return;
    }
    const name = t('pos.held_sale', 'Held Sale') + ' #' + (heldCarts.length + 1);
    holdCart(name);
    toast.info(t('pos.sale_held', 'Sale held for later'));
  }, [cart.items.length, heldCarts.length, holdCart, t]);

  // Recall held sale
  const handleRecall = (heldCart: HeldCart) => {
    recallCart(heldCart.id);
    setShowHeldSales(false);
    toast.info(t('pos.sale_recalled', 'Sale recalled'));
  };

  // Open held sales modal
  const handleOpenHeldSales = useCallback(() => {
    if (heldCarts.length === 0) {
      toast.info(t('pos.no_held_sales', 'No held sales'));
      return;
    }
    setShowHeldSales(true);
  }, [heldCarts.length, t]);

  // Clear cart
  const handleClearCart = () => {
    setShowClearConfirm(false);
    clearCart();
    toast.info(t('pos.cart_cleared', 'Cart cleared'));
  };

  // Checkout
  const handleStartCheckout = useCallback(() => {
    if (cart.items.length === 0) {
      toast.warning(t('pos.cart_empty', 'Cart is empty'));
      return;
    }
    setShowCheckout(true);
  }, [cart.items.length, t]);

  // Checkout success
  const handleCheckoutSuccess = async (saleId: number) => {
    setShowCheckout(false);
    setLastSaleId(saleId);
    setShowSuccessModal(true);
    
    // Refresh products to show updated stock levels
    try {
      await productGridRef.current?.refreshProducts();
    } catch (err) {
      console.error('Failed to refresh products after sale:', err);
    }
  };

  // Focus search
  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Register POS keyboard shortcuts
  usePOSShortcuts({
    onHelp: () => setShowShortcutsHelp(true),
    onSearch: handleFocusSearch,
    onHoldSale: handleHold,
    onRecallSale: handleOpenHeldSales,
    onCheckout: handleStartCheckout,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Shortcut definitions for help modal
  const shortcuts = [
    { key: 'F1', action: t('pos.shortcuts.help', 'Show shortcuts help') },
    { key: 'F2', action: t('pos.shortcuts.search', 'Focus search') },
    { key: 'F5', action: t('pos.shortcuts.hold', 'Hold current sale') },
    { key: 'F6', action: t('pos.shortcuts.recall', 'Recall held sale') },
    { key: 'F12', action: t('pos.shortcuts.checkout', 'Proceed to checkout') },
    { key: 'Esc', action: t('pos.shortcuts.close', 'Close modal') },
  ];

  return (
    <div
      className="flex flex-col"
      style={{
        height: 'calc(100vh - var(--header-height))',
        margin: '-1.5rem', // Counteract AppShell padding
        backgroundColor: 'var(--color-gray-100)',
      }}
    >
      {/* Offline banner - shown when offline or pending syncs */}
      {(!isOnline || pendingCount > 0) && (
        <OfflineIndicator variant="banner" className="flex-shrink-0" />
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Product grid - main area */}
        <div className="flex-1 overflow-hidden">
          <ProductGrid ref={productGridRef} onProductSelect={handleProductSelect} />
        </div>

      {/* Cart panel - sidebar on desktop, bottom sheet on mobile */}
      <div
        className="w-full lg:w-[450px] xl:w-[500px] flex-shrink-0 shadow-lg bg-white dark:bg-zinc-900 flex flex-col max-h-[50vh] lg:max-h-none lg:h-full transition-all duration-300"
      >
        <div className="h-full flex flex-col">
          <CartPanel
            onCheckout={handleStartCheckout}
            onHold={handleHold}
            onClear={() => setShowClearConfirm(true)}
            onRecall={handleOpenHeldSales}
            hasHeldSales={heldCarts.length > 0}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        title={t('pos.keyboard_shortcuts', 'Keyboard Shortcuts')}
        size="sm"
      >
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: 'var(--color-gray-100)' }}
            >
              <span style={{ color: 'var(--color-gray-700)' }}>{action}</span>
              <kbd
                className="px-2 py-1 text-xs font-mono rounded"
                style={{
                  backgroundColor: 'var(--color-gray-100)',
                  color: 'var(--color-gray-900)',
                  border: '1px solid var(--color-gray-300)',
                }}
              >
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <p
          className="mt-4 text-sm text-center"
          style={{ color: 'var(--color-gray-500)' }}
        >
          {t('pos.press_f1_help', 'Press F1 anytime to show this help')}
        </p>
      </Modal>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Clear Cart Confirmation */}
      {showClearConfirm && (
        <Modal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          title={t('pos.clear_cart', 'Clear Cart')}
          size="sm"
        >
          <div className="py-4">
            <p style={{ color: 'var(--color-gray-600)' }}>
              {t('pos.clear_cart_confirm', 'Are you sure you want to remove all items from the cart?')}
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="btn btn-secondary flex-1"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleClearCart}
              className="btn btn-danger flex-1"
            >
              {t('pos.clear', 'Clear')}
            </button>
          </div>
        </Modal>
      )}

      {/* Held Sales Modal */}
      <Modal
        isOpen={showHeldSales}
        onClose={() => setShowHeldSales(false)}
        title={t('pos.held_sales', 'Held Sales')}
        size="md"
      >
        {heldCarts.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--color-gray-500)' }}>
            {t('pos.no_held_sales', 'No held sales')}
          </div>
        ) : (
          <div className="space-y-3">
            {heldCarts.map((heldCart) => {
              const total = heldCart.cart.items.reduce(
                (sum, item) => sum + item.unit_price * item.quantity,
                0
              );
              const discountedTotal = heldCart.cart.discount
                ? total * (1 - heldCart.cart.discount / 100)
                : total;

              return (
                <div
                  key={heldCart.id}
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-gray-200)' }}
                  onClick={() => handleRecall(heldCart)}
                >
                  <div>
                    <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                      {heldCart.name} - {heldCart.cart.items.length} {t('pos.items', 'items')}
                      {heldCart.cart.customer && ` - ${heldCart.cart.customer.name}`}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {heldCart.held_at.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold" style={{ color: 'var(--color-primary-600)' }}>
                      {formatCurrency(discountedTotal)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHeldCart(heldCart.id);
                      }}
                      className="p-2 rounded hover:bg-red-50"
                      style={{ color: 'var(--color-error-500)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Sale Success Modal with Receipt */}
      <SaleSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        saleId={lastSaleId}
      />
      </div>
    </div>
  );
}

export default POSPage;
