/**
 * Quick Add Supplier Modal
 * Allows adding a new supplier directly from PO creation flow
 */

import { useState } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal } from '../ui';
import { FormField, FormActions, FormError } from '../forms';
import { suppliersApi } from '../../lib/apiClient';
import type { CreateSupplierData, Supplier } from '../../types';

interface SupplierQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
}

export function SupplierQuickAddModal({ isOpen, onClose, onSuccess }: SupplierQuickAddModalProps) {
  const { t } = useLocaleStore();

  // Form state
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  const handleClose = () => {
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      tax_number: '',
      is_active: true,
    });
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.required', 'This field is required');
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalid_email', 'Invalid email address');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newSupplier = await suppliersApi.create(formData);
      toast.success(t('suppliers.created', 'Supplier created'));
      onSuccess(newSupplier);
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('error.save_failed', 'Failed to save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('suppliers.quick_add', 'Quick Add Supplier')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        <div className="space-y-4">
          <FormField label={t('suppliers.name', 'Supplier Name')} required error={errors.name}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder={t('suppliers.name_placeholder', 'Enter supplier name')}
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('suppliers.code', 'Code')}>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input"
                placeholder="SUP001"
              />
            </FormField>

            <FormField label={t('suppliers.phone', 'Phone')}>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="+218..."
              />
            </FormField>
          </div>

          <FormField label={t('suppliers.email', 'Email')} error={errors.email}>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="supplier@example.com"
            />
          </FormField>
        </div>

        <FormActions
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          submitLabel={t('common.create', 'Create')}
        />
      </form>
    </Modal>
  );
}

export default SupplierQuickAddModal;
