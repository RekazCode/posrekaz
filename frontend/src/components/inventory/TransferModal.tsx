/**
 * Stock Transfer Modal Component
 * Allows transferring stock between warehouses
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, LoadingSpinner, Select, Badge } from '../ui';
import { FormField, FormActions, FormError } from '../forms';
import { inventoryApi, productsApi } from '../../lib/apiClient';
import type { Warehouse, CreateTransferData, InventoryItem, Product } from '../../types';
import type { PaginatedResponse } from '../../lib/apiClient';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouses: Warehouse[];
  preselectedItem?: InventoryItem | null;
}

export function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  warehouses,
  preselectedItem,
}: TransferModalProps) {
  const { t } = useLocaleStore();

  const [formData, setFormData] = useState<CreateTransferData>({
    product_id: 0,
    source_warehouse_id: 0,
    destination_warehouse_id: 0,
    quantity: 1,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [sourceStock, setSourceStock] = useState<number | null>(null);

  // Form key for reset
  const formKey = useMemo(() => `${preselectedItem?.id ?? 'new'}-${isOpen}`, [preselectedItem?.id, isOpen]);
  const [lastFormKey, setLastFormKey] = useState(formKey);

  // Reset form when modal opens/closes or preselected item changes
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    if (preselectedItem) {
      setFormData({
        product_id: preselectedItem.product_id,
        source_warehouse_id: preselectedItem.warehouse_id,
        destination_warehouse_id: 0,
        quantity: 1,
        notes: '',
      });
      setSourceStock(preselectedItem.available_quantity);
    } else {
      setFormData({
        product_id: 0,
        source_warehouse_id: 0,
        destination_warehouse_id: 0,
        quantity: 1,
        notes: '',
      });
      setSourceStock(null);
    }
    setErrors({});
    setSubmitError(null);
  }

  // Load products for selection
  const loadProducts = useCallback(async () => {
    if (preselectedItem) return; // Don't load if preselected
    setIsLoadingProducts(true);
    try {
      const response: PaginatedResponse<Product> = await productsApi.list({ per_page: 100 });
      setProducts(response.data);
    } catch {
      // Silent fail
    } finally {
      setIsLoadingProducts(false);
    }
  }, [preselectedItem]);

  useEffect(() => {
    if (isOpen && !preselectedItem) {
      loadProducts();
    }
  }, [isOpen, preselectedItem, loadProducts]);

  // Load source stock when product or source warehouse changes
  const loadSourceStock = useCallback(async () => {
    if (formData.product_id && formData.source_warehouse_id && !preselectedItem) {
      try {
        const items = await inventoryApi.getByWarehouse(formData.source_warehouse_id);
        const item = items.find(i => i.product_id === formData.product_id);
        setSourceStock(item?.available_quantity ?? 0);
      } catch {
        setSourceStock(0);
      }
    }
  }, [formData.product_id, formData.source_warehouse_id, preselectedItem]);

  useEffect(() => {
    loadSourceStock();
  }, [loadSourceStock]);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = t('validation.required', 'This field is required');
    }
    if (!formData.source_warehouse_id) {
      newErrors.source_warehouse_id = t('validation.required', 'This field is required');
    }
    if (!formData.destination_warehouse_id) {
      newErrors.destination_warehouse_id = t('validation.required', 'This field is required');
    }
    if (formData.source_warehouse_id === formData.destination_warehouse_id) {
      newErrors.destination_warehouse_id = t('inventory.same_warehouse', 'Source and destination must be different');
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = t('validation.positive', 'Must be greater than 0');
    }
    if (sourceStock !== null && formData.quantity > sourceStock) {
      newErrors.quantity = t('inventory.insufficient_stock', 'Insufficient stock available');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit transfer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      await inventoryApi.createTransfer(formData);
      toast.success(t('inventory.transfer_created', 'Stock transfer initiated'));
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'Failed to create transfer')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Product options
  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.sku} - ${p.name}`,
  }));

  // Warehouse options (excluding selected source for destination)
  const sourceWarehouseOptions = warehouses
    .filter(w => w.is_active)
    .map(w => ({ value: w.id, label: w.name }));

  const destinationWarehouseOptions = warehouses
    .filter(w => w.is_active && w.id !== formData.source_warehouse_id)
    .map(w => ({ value: w.id, label: w.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('inventory.transfer_stock', 'Transfer Stock')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        {/* Product selection (or preselected display) */}
        {preselectedItem ? (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
              {preselectedItem.product?.name}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              SKU: {preselectedItem.product?.sku}
            </div>
          </div>
        ) : (
          <FormField
            label={t('inventory.product', 'Product')}
            error={errors.product_id}
            required
          >
            {isLoadingProducts ? (
              <div className="py-2"><LoadingSpinner size="sm" /></div>
            ) : (
              <Select
                value={formData.product_id}
                onChange={(val) => setFormData({ ...formData, product_id: val as number })}
                options={productOptions}
                placeholder={t('inventory.select_product', 'Select product')}
              />
            )}
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Source warehouse */}
          <FormField
            label={t('inventory.source_warehouse', 'From Warehouse')}
            error={errors.source_warehouse_id}
            required
          >
            <Select
              value={formData.source_warehouse_id}
              onChange={(val) => setFormData({ 
                ...formData, 
                source_warehouse_id: val as number,
                destination_warehouse_id: formData.destination_warehouse_id === val ? 0 : formData.destination_warehouse_id
              })}
              options={sourceWarehouseOptions}
              placeholder={t('inventory.select_warehouse', 'Select')}
              disabled={!!preselectedItem}
            />
          </FormField>

          {/* Destination warehouse */}
          <FormField
            label={t('inventory.destination_warehouse', 'To Warehouse')}
            error={errors.destination_warehouse_id}
            required
          >
            <Select
              value={formData.destination_warehouse_id}
              onChange={(val) => setFormData({ ...formData, destination_warehouse_id: val as number })}
              options={destinationWarehouseOptions}
              placeholder={t('inventory.select_warehouse', 'Select')}
            />
          </FormField>
        </div>

        {/* Quantity with available stock display */}
        <FormField
          label={t('inventory.quantity', 'Quantity')}
          error={errors.quantity}
          required
        >
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={sourceStock ?? undefined}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className={`input flex-1 ${errors.quantity ? 'input-error' : ''}`}
            />
            {sourceStock !== null && (
              <Badge variant={sourceStock > 0 ? 'success' : 'danger'}>
                {t('inventory.available', 'Available')}: {sourceStock}
              </Badge>
            )}
          </div>
        </FormField>

        {/* Notes */}
        <FormField label={t('inventory.notes', 'Notes')}>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            className="input"
            rows={2}
            placeholder={t('inventory.transfer_notes_placeholder', 'Optional transfer notes...')}
          />
        </FormField>

        {/* Transfer preview */}
        {formData.source_warehouse_id > 0 && formData.destination_warehouse_id > 0 && formData.quantity > 0 && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div style={{ color: 'var(--color-gray-500)' }}>{t('inventory.from', 'From')}</div>
                <div className="font-semibold" style={{ color: 'var(--color-gray-900)' }}>
                  {warehouses.find(w => w.id === formData.source_warehouse_id)?.name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" style={{ color: 'var(--color-primary-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="font-bold text-lg" style={{ color: 'var(--color-primary-700)' }}>
                  {formData.quantity}
                </span>
              </div>
              <div className="text-center">
                <div style={{ color: 'var(--color-gray-500)' }}>{t('inventory.to', 'To')}</div>
                <div className="font-semibold" style={{ color: 'var(--color-gray-900)' }}>
                  {warehouses.find(w => w.id === formData.destination_warehouse_id)?.name}
                </div>
              </div>
            </div>
          </div>
        )}

        <FormActions
          onCancel={onClose}
          isSubmitting={isLoading}
          submitLabel={t('inventory.create_transfer', 'Create Transfer')}
        />
      </form>
    </Modal>
  );
}

export default TransferModal;
