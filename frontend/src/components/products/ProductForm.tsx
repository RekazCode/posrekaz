/**
 * Product Form Component
 * Used for creating and editing products
 */

import { useState, useMemo } from 'react';
import { useLocaleStore } from '../../stores';
import { usePermissions } from '../../hooks';
import { Modal, CurrencyInput, Select } from '../ui';
import { FormField, FormActions, FormError } from '../forms';
import { BarcodePrintModal } from './BarcodePrintModal';
import type { Product, CreateProductData, Category } from '../../types';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  product?: Product | null;
  categories: Category[];
  isLoading?: boolean;
}

// Helper to create initial form data
function getInitialFormData(product: Product | null | undefined): CreateProductData {
  if (product) {
    return {
      sku: product.sku || '',
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      cost_price: product.cost_price,
      price: product.price,
      min_stock_level: product.min_stock_level,
      is_active: product.is_active,
    };
  }
  return {
    sku: '',
    barcode: '',
    name: '',
    description: '',
    category_id: null,
    cost_price: 0,
    price: 0,
    min_stock_level: 0,
    is_active: true,
  };
}

export function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  isLoading = false,
}: ProductFormProps) {
  const { t } = useLocaleStore();
  const { hasPermission } = usePermissions();
  const isEdit = !!product;
  const canPrint = hasPermission('products.print');

  // Derive initial form data from product
  const initialFormData = useMemo(() => getInitialFormData(product), [product]);

  // Use a key to reset state when product/isOpen changes
  const formKey = useMemo(() => `${product?.id ?? 'new'}-${isOpen}`, [product?.id, isOpen]);
  
  const [formData, setFormData] = useState<CreateProductData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastFormKey, setLastFormKey] = useState(formKey);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Reset form when product/isOpen changes (using ref comparison pattern)
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    setFormData(getInitialFormData(product));
    setErrors({});
    setSubmitError(null);
  }

  // Handle print barcode - Opens browser-based print modal
  const handlePrintBarcode = () => {
    if (!product?.barcode || !product?.id) return;
    setIsPrintModalOpen(true);
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required', 'This field is required');
    }
    if (formData.price <= 0) {
      newErrors.price = t('validation.positive', 'Must be greater than 0');
    }
    if (formData.cost_price < 0) {
      newErrors.cost_price = t('validation.non_negative', 'Cannot be negative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'Failed to save')
      );
    }
  };

  // Category options
  const categoryOptions = [
    { value: '', label: t('common.none', '(None)') },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('products.edit', 'Edit Product') : t('products.create', 'Add Product')}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SKU */}
          <FormField
            label={t('products.sku', 'SKU')}
            htmlFor="sku"
          >
            <input
              id="sku"
              type="text"
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value || null })}
              className="input"
              placeholder="PRD-001"
            />
          </FormField>

          {/* Barcode */}
          <FormField
            label={t('products.barcode', 'Barcode')}
            htmlFor="barcode"
          >
            <div className="flex gap-2">
              <input
                id="barcode"
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value || null })}
                className="input flex-1"
                placeholder="123456789012"
              />
              {/* Print Barcode Button - only show when editing and has barcode */}
              {isEdit && canPrint && product?.barcode && (
                <button
                  type="button"
                  onClick={handlePrintBarcode}
                  disabled={!formData.barcode}
                  className="btn btn-secondary"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                  title={t('products.print_barcode', 'Print Barcode')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              )}
            </div>
          </FormField>
        </div>

        {/* Name */}
        <FormField
          label={t('products.name', 'Name')}
          htmlFor="name"
          required
          error={errors.name}
        >
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
        </FormField>

        {/* Description */}
        <FormField
          label={t('products.description', 'Description')}
          htmlFor="description"
        >
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            className="input"
            rows={3}
          />
        </FormField>

        {/* Category */}
        <FormField label={t('products.category', 'Category')} htmlFor="category">
          <Select
            value={formData.category_id ?? null}
            onChange={(val) => setFormData({ ...formData, category_id: val as number | null })}
            options={categoryOptions}
            clearable
            searchable
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cost Price */}
          <FormField
            label={t('products.cost_price', 'Cost Price')}
            error={errors.cost_price}
          >
            <CurrencyInput
              value={formData.cost_price}
              onChange={(val) => setFormData({ ...formData, cost_price: val || 0 })}
              error={errors.cost_price}
            />
          </FormField>

          {/* Price */}
          <FormField
            label={t('products.price', 'Price')}
            required
            error={errors.price}
          >
            <CurrencyInput
              value={formData.price}
              onChange={(val) => setFormData({ ...formData, price: val || 0 })}
              error={errors.price}
            />
          </FormField>

          {/* Min Stock Level */}
          <FormField
            label={t('products.min_stock', 'Min Stock Level')}
          >
            <input
              type="number"
              min="0"
              value={formData.min_stock_level}
              onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </FormField>
        </div>

        {/* Active */}
        <div className="flex items-center gap-2 mb-4">
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--color-primary-600)' }}
          />
          <label htmlFor="is_active" style={{ color: 'var(--color-gray-700)' }}>
            {t('products.is_active', 'Product is active')}
          </label>
        </div>

        <FormActions
          onCancel={onClose}
          isSubmitting={isLoading}
          submitLabel={isEdit ? t('common.update', 'Update') : t('common.create', 'Create')}
        />
      </form>

      {/* Barcode Print Modal - Browser-based printing */}
      {product && (
        <BarcodePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          product={product}
        />
      )}
    </Modal>
  );
}
