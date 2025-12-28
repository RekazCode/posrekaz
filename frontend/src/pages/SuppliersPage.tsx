/**
 * Suppliers Page - Full CRUD functionality
 * Manage suppliers for purchase orders
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks/usePermissions';
import {
  DataTable,
  SearchInput,
  Badge,
  Modal,
  ConfirmDialog,
} from '../components/ui';
import { FormField, FormActions, FormError } from '../components/forms';
import { suppliersApi } from '../lib/apiClient';
import type { Supplier, CreateSupplierData } from '../types';
import type { Column } from '../components/ui';

export function SuppliersPage() {
  const { t } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permissions
  const canCreate = hasPermission('suppliers.create');
  const canEdit = hasPermission('suppliers.edit');
  const canDelete = hasPermission('suppliers.delete');

  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await suppliersApi.listAll();
      setSuppliers(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load suppliers'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Filter suppliers
  useEffect(() => {
    if (!search) {
      setFilteredSuppliers(suppliers);
    } else {
      const q = search.toLowerCase();
      setFilteredSuppliers(
        suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.phone?.toLowerCase().includes(q)
        )
      );
    }
  }, [suppliers, search]);

  // Initial load
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Reset form
  const resetForm = () => {
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
  };

  // Open create modal
  const handleCreate = () => {
    resetForm();
    setEditingSupplier(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      code: supplier.code || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      tax_number: supplier.tax_number || '',
      is_active: supplier.is_active,
    });
    setErrors({});
    setSubmitError(null);
    setEditingSupplier(supplier);
    setShowModal(true);
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
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData);
        toast.success(t('suppliers.updated', 'Supplier updated'));
      } else {
        await suppliersApi.create(formData);
        toast.success(t('suppliers.created', 'Supplier created'));
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('error.save_failed', 'Failed to save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete supplier
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await suppliersApi.delete(deletingId);
      toast.success(t('suppliers.deleted', 'Supplier deleted'));
      setDeletingId(null);
      loadSuppliers();
    } catch {
      toast.error(t('error.delete_failed', 'Failed to delete supplier'));
    }
  };

  // Table columns
  const columns: Column<Supplier>[] = [
    {
      key: 'code',
      header: t('suppliers.code', 'Code'),
      width: '100px',
      render: (supplier) => (
        <span className="font-mono text-sm" style={{ color: 'var(--color-gray-600)' }}>
          {supplier.code || '-'}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('suppliers.name', 'Name'),
      render: (supplier) => (
        <div>
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {supplier.name}
          </span>
          {supplier.email && (
            <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              {supplier.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('suppliers.phone', 'Phone'),
      hideOnMobile: true,
      render: (supplier) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {supplier.phone || '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: t('common.status', 'Status'),
      align: 'center',
      width: '100px',
      render: (supplier) => (
        <Badge variant={supplier.is_active ? 'success' : 'default'} dot>
          {supplier.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: '100px',
      render: (supplier) => (
        <div className="flex items-center justify-end gap-2">
          {canEdit && (
            <button
              onClick={() => handleEdit(supplier)}
              className="p-2 rounded-lg hover:bg-gray-100"
              title={t('common.edit', 'Edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setDeletingId(supplier.id)}
              className="p-2 rounded-lg hover:bg-red-100 text-red-600"
              title={t('common.delete', 'Delete')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.suppliers', 'Suppliers')}
        </h1>
        {canCreate && (
          <button onClick={handleCreate} className="btn btn-primary">
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('suppliers.add', 'Add Supplier')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('suppliers.search_placeholder', 'Search by name, code, email...')}
        />
      </div>

      {/* Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          keyExtractor={(s) => s.id}
          isLoading={isLoading}
          emptyIcon="🏭"
          emptyTitle={t('suppliers.empty', 'No suppliers found')}
          emptyDescription={t('suppliers.empty_desc', 'Add your first supplier to get started')}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? t('suppliers.edit', 'Edit Supplier') : t('suppliers.add', 'Add Supplier')}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {submitError && <FormError message={submitError} />}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('suppliers.name', 'Name')} required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder={t('suppliers.name_placeholder', 'Supplier name')}
              />
            </FormField>

            <FormField label={t('suppliers.code', 'Code')}>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input"
                placeholder={t('suppliers.code_placeholder', 'SUP001')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('suppliers.email', 'Email')} error={errors.email}>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="supplier@example.com"
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

          <FormField label={t('suppliers.address', 'Address')}>
            <textarea
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              rows={2}
              placeholder={t('suppliers.address_placeholder', 'Full address...')}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('suppliers.tax_number', 'Tax Number')}>
              <input
                type="text"
                value={formData.tax_number || ''}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                className="input"
                placeholder={t('suppliers.tax_placeholder', 'Tax ID')}
              />
            </FormField>

            <FormField label={t('common.status', 'Status')}>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: 'var(--color-primary-600)' }}
                />
                <span style={{ color: 'var(--color-gray-700)' }}>
                  {t('suppliers.is_active', 'Active supplier')}
                </span>
              </label>
            </FormField>
          </div>

          <FormActions
            onCancel={() => setShowModal(false)}
            isSubmitting={isSubmitting}
            submitLabel={editingSupplier ? t('common.save', 'Save') : t('common.create', 'Create')}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title={t('suppliers.delete', 'Delete Supplier')}
        message={t('suppliers.delete_confirm', 'Are you sure you want to delete this supplier?')}
        confirmLabel={t('common.delete', 'Delete')}
        variant="danger"
      />
    </div>
  );
}

export default SuppliersPage;
