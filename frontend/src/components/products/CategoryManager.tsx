/**
 * Category Manager Component
 * Manages product categories with CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../../stores';
import { Modal, ConfirmDialog, LoadingSpinner, EmptyState } from '../ui';
import { FormField, FormActions, FormError } from '../forms';
import { categoriesApi } from '../../lib/apiClient';
import type { Category, CreateCategoryData } from '../../types';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange: () => void;
}

export function CategoryManager({ isOpen, onClose, onCategoriesChange }: CategoryManagerProps) {
  const { t } = useLocaleStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await categoriesApi.delete(deleteId);
      toast.success(t('categories.deleted', 'Category deleted'));
      setDeleteId(null);
      loadCategories();
      onCategoriesChange();
    } catch {
      toast.error(t('error.delete_failed', 'Failed to delete'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('categories.manage', 'Manage Categories')}
        size="lg"
      >
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsFormOpen(true);
            }}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('categories.add', 'Add Category')}
          </button>
        </div>

        {isLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon="📁"
            title={t('categories.empty', 'No categories yet')}
            description={t('categories.empty_desc', 'Create your first category to organize products')}
          />
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{ borderColor: 'var(--color-gray-200)' }}
              >
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                    {category.name}
                  </h4>
                  {category.description && (
                    <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {category.description}
                    </p>
                  )}
                  {category.products_count !== undefined && (
                    <span className="text-sm" style={{ color: 'var(--color-gray-400)' }}>
                      {category.products_count} {t('common.products', 'products')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="btn btn-ghost p-2"
                    title={t('common.edit', 'Edit')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteId(category.id)}
                    className="btn btn-ghost p-2"
                    style={{ color: 'var(--color-error-600)' }}
                    title={t('common.delete', 'Delete')}
                    disabled={(category.products_count ?? 0) > 0}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Category Form */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
          loadCategories();
          onCategoriesChange();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('categories.delete_title', 'Delete Category')}
        message={t('categories.delete_confirm', 'Are you sure you want to delete this category?')}
        confirmText={t('common.delete', 'Delete')}
        isLoading={isDeleting}
      />
    </>
  );
}

// Category Form Modal
interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: () => void;
}

function CategoryForm({ isOpen, onClose, category, onSave }: CategoryFormProps) {
  const { t } = useLocaleStore();
  const isEdit = !!category;

  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    description: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        is_active: category.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [category, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.required', 'This field is required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      if (isEdit && category) {
        await categoriesApi.update(category.id, formData);
        toast.success(t('categories.updated', 'Category updated'));
      } else {
        await categoriesApi.create(formData);
        toast.success(t('categories.created', 'Category created'));
      }
      onSave();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'Failed to save')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('categories.edit', 'Edit Category') : t('categories.add', 'Add Category')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        <FormField
          label={t('categories.name', 'Name')}
          htmlFor="cat-name"
          required
          error={errors.name}
        >
          <input
            id="cat-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
        </FormField>

        <FormField
          label={t('categories.description', 'Description')}
          htmlFor="cat-description"
        >
          <textarea
            id="cat-description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            className="input"
            rows={3}
          />
        </FormField>

        <div className="flex items-center gap-2 mb-4">
          <input
            id="cat-is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--color-primary-600)' }}
          />
          <label htmlFor="cat-is_active" style={{ color: 'var(--color-gray-700)' }}>
            {t('categories.is_active', 'Category is active')}
          </label>
        </div>

        <FormActions
          onCancel={onClose}
          isSubmitting={isLoading}
          submitLabel={isEdit ? t('common.update', 'Update') : t('common.create', 'Create')}
        />
      </form>
    </Modal>
  );
}
