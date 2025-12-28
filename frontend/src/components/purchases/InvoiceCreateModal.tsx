/**
 * Purchase Invoice Create Modal
 * Creates a purchase invoice and immediately updates stock
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, Select, CurrencyInput, LoadingSpinner } from '../ui';
import { FormField } from '../forms';
import { purchaseInvoicesApi, suppliersApi, productsApi, warehousesApi } from '../../lib/apiClient';
import type { Supplier, Product, Warehouse, PurchaseInvoiceItemData } from '../../types';

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem extends PurchaseInvoiceItemData {
  product?: Product;
}

export function InvoiceCreateModal({ isOpen, onClose, onSuccess }: InvoiceCreateModalProps) {
  const { t, locale, direction } = useLocaleStore();

  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState('');

  // Load data
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [suppliersData, productsData, warehousesData] = await Promise.all([
          suppliersApi.listAll(),
          productsApi.list({ per_page: 1000 }),
          warehousesApi.list(),
        ]);
        setSuppliers(suppliersData);
        setProducts(productsData.data);
        setWarehouses(warehousesData);
        
        // Set first warehouse as default
        if (warehousesData.length > 0 && !warehouseId) {
          setWarehouseId(warehousesData[0].id);
        }
      } catch {
        toast.error(t('error.load_failed', 'Failed to load data'));
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, t, warehouseId]);

  // Reset form
  const resetForm = () => {
    setSupplierId(null);
    setSupplierInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setDiscountAmount(0);
    setShippingCost(0);
    setNotes('');
    setItems([]);
    setProductSearch('');
  };

  // Close handler
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Supplier options
  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  // Warehouse options
  const warehouseOptions = warehouses.map((w) => ({
    value: w.id,
    label: w.name,
  }));

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 20);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.barcode?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [products, productSearch]);

  // Add product to items
  const addProduct = (product: Product) => {
    if (items.some((i) => i.product_id === product.id)) {
      toast.warning(t('purchases.already_added', 'Product already added'));
      return;
    }
    setItems([
      ...items,
      {
        product_id: product.id,
        product,
        quantity: 1,
        unit_cost: product.cost_price || 0,
        tax_rate: 0,
        discount_amount: 0,
        update_cost_price: false,
      },
    ]);
    setProductSearch('');
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItem, value: number | boolean) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    const itemDiscounts = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
    const taxTotal = items.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unit_cost;
      return sum + (lineSubtotal * (item.tax_rate || 0) / 100);
    }, 0);
    const total = subtotal - itemDiscounts - discountAmount + taxTotal + shippingCost;
    return { subtotal, itemDiscounts, taxTotal, total };
  }, [items, discountAmount, shippingCost]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Submit
  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error(t('purchases.select_supplier', 'Please select a supplier'));
      return;
    }
    if (items.length === 0) {
      toast.error(t('purchases.no_items', 'Please add at least one item'));
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseInvoicesApi.create({
        supplier_id: supplierId,
        warehouse_id: warehouseId || undefined,
        supplier_invoice_number: supplierInvoiceNumber || undefined,
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        notes: notes || undefined,
        items: items.map(({ product, ...item }) => item),
      });

      toast.success(t('purchases.created', 'Purchase invoice created and stock updated'));
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(t('error.create_failed', 'Failed to create invoice'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('purchases.create', 'New Purchase Invoice')}
      size="xl"
    >
      {isLoadingData ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6" dir={direction}>
          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier */}
            <FormField label={t('purchases.supplier', 'Supplier')} required>
              <Select
                value={supplierId}
                onChange={(val) => setSupplierId(val as number)}
                options={supplierOptions}
                placeholder={t('purchases.select_supplier', 'Select supplier')}
                searchable
              />
            </FormField>

            {/* Warehouse */}
            <FormField label={t('purchases.warehouse', 'Warehouse')}>
              <Select
                value={warehouseId}
                onChange={(val) => setWarehouseId(val as number)}
                options={warehouseOptions}
                placeholder={t('purchases.select_warehouse', 'Select warehouse')}
              />
            </FormField>

            {/* Supplier Invoice # */}
            <FormField label={t('purchases.supplier_invoice', 'Supplier Invoice #')}>
              <input
                type="text"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                className="input"
                placeholder={t('purchases.supplier_invoice_placeholder', 'Enter supplier invoice number...')}
              />
            </FormField>

            {/* Invoice Date */}
            <FormField label={t('purchases.date', 'Invoice Date')} required>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="input"
              />
            </FormField>

            {/* Due Date */}
            <FormField label={t('purchases.due_date', 'Due Date')}>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </FormField>
          </div>

          {/* Items Section */}
          <div className="border rounded-lg p-4 dark:border-zinc-700">
            <h3 className="font-semibold mb-4">{t('purchases.items', 'Items')}</h3>

            {/* Product Search */}
            <div className="mb-4">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input"
                placeholder={t('purchases.search_products', 'Search by name, SKU, barcode...')}
              />
              
              {/* Search Results */}
              {productSearch && filteredProducts.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto dark:border-zinc-700">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full px-4 py-2 text-start hover:bg-gray-100 dark:hover:bg-zinc-800 flex justify-between items-center"
                    >
                      <span>{product.name}</span>
                      <span className="text-gray-500 text-sm">{product.sku}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('purchases.no_items', 'No items added yet')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-zinc-700">
                      <th className="text-start py-2 px-2">{t('common.product', 'Product')}</th>
                      <th className="text-center py-2 px-2 w-20">{t('purchases.qty', 'Qty')}</th>
                      <th className="text-center py-2 px-2 w-28">{t('purchases.unit_cost', 'Cost')}</th>
                      <th className="text-center py-2 px-2 w-20">{t('purchases.tax_rate', 'Tax %')}</th>
                      <th className="text-end py-2 px-2 w-28">{t('purchases.subtotal', 'Subtotal')}</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b dark:border-zinc-700">
                        <td className="py-2 px-2">
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-gray-500 text-xs">{item.product?.sku}</div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="input text-center w-full"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <CurrencyInput
                            value={item.unit_cost}
                            onChange={(val) => updateItem(index, 'unit_cost', val || 0)}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.tax_rate || 0}
                            onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                            className="input text-center w-full"
                          />
                        </td>
                        <td className="py-2 px-2 text-end font-medium">
                          {formatCurrency(item.quantity * item.unit_cost)}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Additional costs */}
            <div className="space-y-4">
              <FormField label={t('purchases.discount', 'Discount')}>
                <CurrencyInput
                  value={discountAmount}
                  onChange={(val) => setDiscountAmount(val || 0)}
                />
              </FormField>
              <FormField label={t('purchases.shipping', 'Shipping')}>
                <CurrencyInput
                  value={shippingCost}
                  onChange={(val) => setShippingCost(val || 0)}
                />
              </FormField>
              <FormField label={t('purchases.notes', 'Notes')}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="input"
                  placeholder={t('purchases.notes_placeholder', 'Optional notes...')}
                />
              </FormField>
            </div>

            {/* Right: Totals Summary */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>{t('purchases.subtotal', 'Subtotal')}</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.itemDiscounts > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t('purchases.discount', 'Item Discounts')}</span>
                  <span>-{formatCurrency(totals.itemDiscounts)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t('purchases.discount', 'Invoice Discount')}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {totals.taxTotal > 0 && (
                <div className="flex justify-between">
                  <span>{t('purchases.tax_total', 'Tax')}</span>
                  <span>{formatCurrency(totals.taxTotal)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>{t('purchases.shipping', 'Shipping')}</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-zinc-600">
                <span>{t('purchases.total', 'Total')}</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Stock Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {t('purchases.stock_updated', 'Stock will be automatically increased when this invoice is created.')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-700">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isSubmitting || items.length === 0}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {t('purchases.create', 'Create Invoice')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
