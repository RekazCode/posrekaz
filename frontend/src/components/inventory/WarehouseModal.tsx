/**
 * Warehouse Modal Component
 * CRUD operations for warehouse management
 */

import { useState, useMemo } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal } from '../ui';
import { FormField, FormActions, FormError } from '../forms';
import { warehousesApi } from '../../lib/apiClient';
import type { Warehouse, CreateWarehouseData } from '../../types';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouse?: Warehouse | null;
}

export function WarehouseModal({
  isOpen,
  onClose,
  onSuccess,
  warehouse,
}: WarehouseModalProps) {
  const { t } = useLocaleStore();
  const isEdit = !!warehouse;

  const [formData, setFormData] = useState<CreateWarehouseData>({
    name: '',
    code: '',
    address: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form key for reset
  const formKey = useMemo(() => `${warehouse?.id ?? 'new'}-${isOpen}`, [warehouse?.id, isOpen]);
  const [lastFormKey, setLastFormKey] = useState(formKey);

  // Reset form when modal opens/closes or warehouse changes
  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || '',
        is_active: warehouse.is_active,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required', 'This field is required');
    }
    if (!formData.code.trim()) {
      newErrors.code = t('validation.required', 'This field is required');
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      newErrors.code = t('validation.alphanumeric', 'Only letters, numbers, and dashes allowed');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      const data = {
        ...formData,
        address: formData.address?.trim() || null,
      };

      if (isEdit && warehouse) {
        await warehousesApi.update(warehouse.id, data);
        toast.success(t('warehouses.updated', 'Warehouse updated'));
      } else {
        await warehousesApi.create(data);
        toast.success(t('warehouses.created', 'Warehouse created'));
      }
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'Failed to save')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate code from name
  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    
    // Auto-generate code if not editing and code is empty or auto-generated
    if (!isEdit && (!formData.code || formData.code === formData.name.toUpperCase().replace(/\s+/g, '_').slice(0, 10))) {
      const code = name.toUpperCase().replace(/\s+/g, '_').slice(0, 10);
      setFormData(prev => ({ ...prev, name, code }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit 
        ? t('warehouses.edit', 'Edit Warehouse')
        : t('warehouses.create', 'Create Warehouse')
      }
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        {/* Name */}
        <FormField
          label={t('warehouses.name', 'Warehouse Name')}
          error={errors.name}
          required
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder={t('warehouses.name_placeholder', 'e.g., Main Warehouse')}
            autoFocus
          />
        </FormField>

        {/* Code */}
        <FormField
          label={t('warehouses.code', 'Code')}
          error={errors.code}
          required
        >
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className={`input font-mono ${errors.code ? 'input-error' : ''}`}
            placeholder={t('warehouses.code_placeholder', 'e.g., MAIN_WH')}
            maxLength={20}
          />
          <div className="text-xs mt-1" style={{ color: 'var(--color-gray-500)' }}>
            {t('warehouses.code_hint', 'Unique identifier for the warehouse')}
          </div>
        </FormField>

        {/* Address */}
        <FormField label={t('warehouses.address', 'Address')}>
          <textarea
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="input"
            rows={2}
            placeholder={t('warehouses.address_placeholder', 'Physical location address...')}
          />
        </FormField>

        {/* Active status */}
        <FormField label={t('warehouses.status', 'Status')}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded"
              style={{ accentColor: 'var(--color-primary-600)' }}
            />
            <div>
              <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                {t('warehouses.active', 'Active')}
              </span>
              <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                {t('warehouses.active_hint', 'Inactive warehouses are hidden from selection')}
              </div>
            </div>
          </label>
        </FormField>

        <FormActions
          onCancel={onClose}
          isSubmitting={isLoading}
          submitLabel={isEdit ? t('common.save', 'Save') : t('common.create', 'Create')}
        />
      </form>
    </Modal>
  );
}

export default WarehouseModal;
