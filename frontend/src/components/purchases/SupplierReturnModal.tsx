/**
 * Supplier Return Modal
 * Create returns to suppliers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, LoadingSpinner, Select } from '../ui';
import { FormField, FormActions, FormError } from '../forms';
import { supplierReturnsApi, suppliersApi, productsApi } from '../../lib/apiClient';
import type { Supplier, Product, CreateSupplierReturnData } from '../../types';
import type { PaginatedResponse } from '../../lib/apiClient';

interface SupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedSupplierId?: number | null;
}

interface ReturnItem {
  product_id: number;
  product?: Product;
  quantity: number;
  unit_cost: number;
  reason: string;
}

export function SupplierReturnModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedSupplierId,
}: SupplierReturnModalProps) {
  const { t, locale } = useLocaleStore();

  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form
  const [supplierId, setSupplierId] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ReturnItem[]>([]);

  // Product search
  const [productSearch, setProductSearch] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  }, [locale]);

  // Load initial data
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [suppliersData, productsData] = await Promise.all([
          suppliersApi.listAll(),
          productsApi.list({ per_page: 100 }) as Promise<PaginatedResponse<Product>>,
        ]);
        setSuppliers(suppliersData.filter((s) => s.is_active));
        setProducts(productsData.data);
      } catch {
        toast.error(t('error.load_failed', 'Failed to load data'));
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isOpen, t]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSupplierId(preselectedSupplierId || 0);
      setReason('');
      setNotes('');
      setItems([]);
      setProductSearch('');
      setSubmitError(null);
    }
  }, [isOpen, preselectedSupplierId]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [products, productSearch]);

  // Add product
  const addProduct = (product: Product) => {
    if (items.some((i) => i.product_id === product.id)) {
      toast.warning(t('returns.already_added', 'Product already added'));
      return;
    }
    setItems([
      ...items,
      {
        product_id: product.id,
        product,
        quantity: 1,
        unit_cost: product.cost_price || product.price,
        reason: '',
      },
    ]);
    setProductSearch('');
  };

  // Update item
  const updateItem = (index: number, field: keyof ReturnItem, value: number | string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate total
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  }, [items]);

  // Validate
  const isValid = supplierId > 0 && items.length > 0 && items.every((i) => i.quantity > 0);

  // Submit
  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data: CreateSupplierReturnData = {
        supplier_id: supplierId,
        reason: reason || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          reason: i.reason || undefined,
        })),
      };

      await supplierReturnsApi.create(data);
      toast.success(t('returns.created', 'Return created successfully'));
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('error.save_failed', 'Failed to create return'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return reason options
  const reasonOptions = [
    { value: '', label: t('common.select', 'Select reason...') },
    { value: 'defective', label: t('returns.defective', 'Defective/Damaged') },
    { value: 'wrong_item', label: t('returns.wrong_item', 'Wrong Item Received') },
    { value: 'overstock', label: t('returns.overstock', 'Overstock') },
    { value: 'expired', label: t('returns.expired', 'Expired') },
    { value: 'other', label: t('returns.other', 'Other') },
  ];

  if (isLoadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('returns.create', 'Create Supplier Return')}>
        <div className="py-12">
          <LoadingSpinner />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('returns.create', 'Create Supplier Return')}
      size="lg"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {submitError && <FormError message={submitError} />}

      <div className="space-y-4">
        {/* Supplier selection */}
        <FormField label={t('returns.supplier', 'Supplier')} required>
          <Select
            value={supplierId}
            onChange={(val) => setSupplierId(val as number)}
            options={[
              { value: 0, label: t('common.select', 'Select supplier...') },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </FormField>

        {/* General reason */}
        <FormField label={t('returns.reason', 'Return Reason')}>
          <Select
            value={reason}
            onChange={(val) => setReason(val as string)}
            options={reasonOptions}
          />
        </FormField>

        {/* Product search */}
        <FormField label={t('returns.add_products', 'Add Products to Return')}>
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="input"
              placeholder={t('returns.search_products', 'Search products...')}
            />
            {productSearch && filteredProducts.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-48 overflow-auto"
                style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-gray-200)' }}
              >
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full p-3 text-start hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <div style={{ color: 'var(--color-gray-900)' }}>{product.name}</div>
                      <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{product.sku}</div>
                    </div>
                    <span style={{ color: 'var(--color-gray-600)' }}>
                      {formatCurrency(product.cost_price || product.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormField>

        {/* Items list */}
        {items.length > 0 && (
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr>
                  <th className="px-4 py-2 text-start">{t('products.name', 'Product')}</th>
                  <th className="px-4 py-2 text-center w-20">{t('returns.qty', 'Qty')}</th>
                  <th className="px-4 py-2 text-end w-28">{t('returns.unit_cost', 'Unit Cost')}</th>
                  <th className="px-4 py-2 text-end w-28">{t('returns.subtotal', 'Subtotal')}</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.product_id} className="border-t" style={{ borderColor: 'var(--color-gray-100)' }}>
                    <td className="px-4 py-2">
                      <div style={{ color: 'var(--color-gray-900)' }}>{item.product?.name}</div>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateItem(idx, 'reason', e.target.value)}
                        className="input mt-1 text-xs"
                        placeholder={t('returns.item_reason', 'Item reason...')}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="input text-center w-16"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                        className="input text-end w-24"
                      />
                    </td>
                    <td className="px-4 py-2 text-end font-medium" style={{ color: 'var(--color-gray-900)' }}>
                      {formatCurrency(item.quantity * item.unit_cost)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr className="border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
                  <td colSpan={3} className="px-4 py-3 text-end font-semibold">
                    {t('common.total', 'Total')}:
                  </td>
                  <td className="px-4 py-3 text-end font-bold" style={{ color: 'var(--color-primary-600)' }}>
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <div className="py-8 text-center" style={{ color: 'var(--color-gray-500)' }}>
            {t('returns.no_items', 'Search and add products to return')}
          </div>
        )}

        {/* Notes */}
        <FormField label={t('returns.notes', 'Notes')}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            rows={2}
            placeholder={t('returns.notes_placeholder', 'Additional notes...')}
          />
        </FormField>
      </div>

      <FormActions
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel={t('returns.create', 'Create Return')}
        disabled={!isValid}
      />
      </form>
    </Modal>
  );
}

export default SupplierReturnModal;
