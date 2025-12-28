/**
 * Purchase Order Create/Edit Modal
 * Multi-step wizard for creating purchase orders
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, LoadingSpinner, Select, Badge } from '../ui';
import { FormField, FormError } from '../forms';
import { purchasesApi, suppliersApi, productsApi, warehousesApi } from '../../lib/apiClient';
import { SupplierQuickAddModal } from './SupplierQuickAddModal';
import type { Supplier, Warehouse, Product, CreatePOData, POItemData } from '../../types';
import type { PaginatedResponse } from '../../lib/apiClient';

interface POCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type WizardStep = 'supplier' | 'items' | 'review';

export function POCreateModal({ isOpen, onClose, onSuccess }: POCreateModalProps) {
  const { t, locale } = useLocaleStore();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('supplier');

  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form data
  const [supplierId, setSupplierId] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<POItemData[]>([]);

  // Product search
  const [productSearch, setProductSearch] = useState('');

  // Supplier quick add modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);

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
        const [suppliersData, warehousesData, productsData] = await Promise.all([
          suppliersApi.listAll(),
          warehousesApi.list(),
          productsApi.list({ per_page: 100 }) as Promise<PaginatedResponse<Product>>,
        ]);
        setSuppliers(suppliersData.filter((s) => s.is_active));
        setWarehouses(warehousesData.filter((w) => w.is_active));
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
      setStep('supplier');
      setSupplierId(0);
      setWarehouseId(0);
      setExpectedDate('');
      setNotes('');
      setItems([]);
      setProductSearch('');
      setSubmitError(null);
    }
  }, [isOpen]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 20);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
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
        quantity: 1,
        unit_cost: product.cost_price || product.price,
      },
    ]);
    setProductSearch('');
  };

  // Update item
  const updateItem = (index: number, field: 'quantity' | 'unit_cost', value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Get product by ID
  const getProduct = (productId: number) => {
    return products.find((p) => p.id === productId);
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    return { subtotal, tax: 0, total: subtotal };
  }, [items]);

  // Validate step
  const canProceed = () => {
    switch (step) {
      case 'supplier':
        return supplierId > 0 && warehouseId > 0;
      case 'items':
        return items.length > 0 && items.every((i) => i.quantity > 0 && i.unit_cost >= 0);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Navigate steps
  const nextStep = () => {
    if (step === 'supplier') setStep('items');
    else if (step === 'items') setStep('review');
  };

  const prevStep = () => {
    if (step === 'items') setStep('supplier');
    else if (step === 'review') setStep('items');
  };

  // Submit PO
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data: CreatePOData = {
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        expected_date: expectedDate || null,
        notes: notes || null,
        items,
      };

      await purchasesApi.create(data);
      toast.success(t('purchases.created', 'Purchase order created'));
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('error.save_failed', 'Failed to create'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selected supplier/warehouse names
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  // Handle new supplier added
  const handleSupplierAdded = (newSupplier: Supplier) => {
    setSuppliers([...suppliers, newSupplier]);
    setSupplierId(newSupplier.id);
    toast.success(t('suppliers.added_and_selected', 'Supplier added and selected'));
  };

  if (isLoadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('purchases.create', 'Create Purchase Order')}>
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
      title={t('purchases.create', 'Create Purchase Order')}
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {(['supplier', 'items', 'review'] as WizardStep[]).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s
                  ? 'bg-primary-600 text-white'
                  : idx < ['supplier', 'items', 'review'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx + 1}
            </div>
            {idx < 2 && (
              <div
                className="w-12 h-1 mx-2"
                style={{
                  backgroundColor:
                    idx < ['supplier', 'items', 'review'].indexOf(step)
                      ? 'var(--color-success-500)'
                      : 'var(--color-gray-200)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {submitError && <FormError message={submitError} />}

      {/* Step 1: Supplier Selection */}
      {step === 'supplier' && (
        <div className="space-y-4">
          <FormField label={t('purchases.supplier', 'Supplier')} required>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={supplierId}
                  onChange={(val) => setSupplierId(val as number)}
                  options={[
                    { value: 0, label: t('common.select', 'Select...') },
                    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  placeholder={t('purchases.select_supplier', 'Select supplier')}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="btn btn-secondary px-3"
                title={t('suppliers.add', 'Add Supplier')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </FormField>

          <FormField label={t('purchases.warehouse', 'Destination Warehouse')} required>
            <Select
              value={warehouseId}
              onChange={(val) => setWarehouseId(val as number)}
              options={[
                { value: 0, label: t('common.select', 'Select...') },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              placeholder={t('purchases.select_warehouse', 'Select warehouse')}
            />
          </FormField>

          <FormField label={t('purchases.expected_date', 'Expected Delivery Date')}>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </FormField>

          <FormField label={t('purchases.notes', 'Notes')}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder={t('purchases.notes_placeholder', 'Optional notes...')}
            />
          </FormField>
        </div>
      )}

      {/* Step 2: Items Selection */}
      {step === 'items' && (
        <div className="space-y-4">
          {/* Product search */}
          <FormField label={t('purchases.add_products', 'Add Products')}>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input"
                placeholder={t('purchases.search_products', 'Search by name, SKU, barcode...')}
              />
              {productSearch && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-48 overflow-auto"
                  style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-gray-200)' }}
                >
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {t('common.no_results', 'No results found')}
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full p-3 text-start hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div>
                          <div style={{ color: 'var(--color-gray-900)' }}>{product.name}</div>
                          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                            {product.sku}
                          </div>
                        </div>
                        <span style={{ color: 'var(--color-gray-600)' }}>
                          {formatCurrency(product.cost_price || product.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </FormField>

          {/* Items list */}
          {items.length === 0 ? (
            <div className="py-8 text-center" style={{ color: 'var(--color-gray-500)' }}>
              {t('purchases.no_items', 'No items added yet')}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                  <tr>
                    <th className="px-4 py-2 text-start">{t('products.name', 'Product')}</th>
                    <th className="px-4 py-2 text-center w-24">{t('purchases.qty', 'Qty')}</th>
                    <th className="px-4 py-2 text-end w-32">{t('purchases.unit_cost', 'Unit Cost')}</th>
                    <th className="px-4 py-2 text-end w-32">{t('purchases.subtotal', 'Subtotal')}</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const product = getProduct(item.product_id);
                    return (
                      <tr key={item.product_id} className="border-t" style={{ borderColor: 'var(--color-gray-100)' }}>
                        <td className="px-4 py-2">
                          <div style={{ color: 'var(--color-gray-900)' }}>{product?.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>{product?.sku}</div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="input text-center w-20"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={item.unit_cost}
                            onChange={(e) => updateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="input text-end w-28"
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="w-64 space-y-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('common.total', 'Total')}:</span>
                  <span style={{ color: 'var(--color-primary-600)' }}>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.supplier', 'Supplier')}</div>
              <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>{selectedSupplier?.name}</div>
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.warehouse', 'Warehouse')}</div>
              <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>{selectedWarehouse?.name}</div>
            </div>
            {expectedDate && (
              <div>
                <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.expected_date', 'Expected Date')}</div>
                <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>{new Date(expectedDate).toLocaleDateString(locale)}</div>
              </div>
            )}
            <div>
              <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.items_count', 'Items')}</div>
              <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>{items.length}</div>
            </div>
          </div>

          {/* Items preview */}
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
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
                {items.map((item) => {
                  const product = getProduct(item.product_id);
                  return (
                    <tr key={item.product_id} className="border-t" style={{ borderColor: 'var(--color-gray-100)' }}>
                      <td className="px-4 py-2" style={{ color: 'var(--color-gray-900)' }}>{product?.name}</td>
                      <td className="px-4 py-2 text-center" style={{ color: 'var(--color-gray-600)' }}>{item.quantity}</td>
                      <td className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-2 text-end font-medium" style={{ color: 'var(--color-gray-900)' }}>{formatCurrency(item.quantity * item.unit_cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr className="border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
                  <td colSpan={3} className="px-4 py-3 text-end font-semibold">{t('common.total', 'Total')}:</td>
                  <td className="px-4 py-3 text-end font-bold" style={{ color: 'var(--color-primary-600)' }}>{formatCurrency(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {notes && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
              <div className="text-sm mb-1" style={{ color: 'var(--color-gray-500)' }}>{t('purchases.notes', 'Notes')}</div>
              <div style={{ color: 'var(--color-gray-700)' }}>{notes}</div>
            </div>
          )}

          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-warning-300)', backgroundColor: 'var(--color-warning-50)' }}>
            <div className="flex items-center gap-2">
              <Badge variant="warning">{t('purchases.draft', 'Draft')}</Badge>
              <span className="text-sm" style={{ color: 'var(--color-warning-700)' }}>
                {t('purchases.draft_note', 'This PO will be created as a draft. You can send it to the supplier later.')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-gray-200)' }}>
        <button
          onClick={step === 'supplier' ? onClose : prevStep}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          {step === 'supplier' ? t('common.cancel', 'Cancel') : t('common.back', 'Back')}
        </button>

        {step === 'review' ? (
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ms-2">{t('common.creating', 'Creating...')}</span>
              </>
            ) : (
              t('purchases.create_order', 'Create Order')
            )}
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="btn btn-primary"
            disabled={!canProceed()}
          >
            {t('common.next', 'Next')}
          </button>
        )}
      </div>

      {/* Supplier Quick Add Modal */}
      <SupplierQuickAddModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSuccess={handleSupplierAdded}
      />
    </Modal>
  );
}

export default POCreateModal;
