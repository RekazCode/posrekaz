/**
 * Products Page - Full implementation
 * Product catalog management with CRUD, search, filters
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks';
import {
  DataTable,
  SearchInput,
  Select,
  Badge,
  ConfirmDialog,
} from '../components/ui';
import { ProductForm, CategoryManager } from '../components/products';
import { productsApi, categoriesApi } from '../lib/apiClient';
import type { Product, Category, CreateProductData, ProductListParams } from '../types';
import type { Column } from '../components/ui';

export function ProductsPage() {
  const { t, locale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.update');
  const canDelete = hasPermission('products.delete');

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Sort
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Load products
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: ProductListParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
        category_id: categoryFilter,
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        sort_by: sortKey,
        sort_direction: sortDirection,
      };

      const response = await productsApi.list(params);
      setProducts(response.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'Failed to load products'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, categoryFilter, activeFilter, sortKey, sortDirection, t]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.list();
      setCategories(data);
    } catch {
      // Failed to load categories
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, categoryFilter, activeFilter]);

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Handle create/edit
  const handleSubmit = async (data: CreateProductData) => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
        toast.success(t('products.updated', 'Product updated successfully'));
      } else {
        await productsApi.create(data);
        toast.success(t('products.created', 'Product created successfully'));
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      loadProducts();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await productsApi.delete(deleteId);
      toast.success(t('products.deleted', 'Product deleted successfully'));
      setDeleteId(null);
      loadProducts();
    } catch {
      toast.error(t('error.delete_failed', 'Failed to delete product'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount) + ' ' + t('currency.lyd', 'LYD');
  };

  // Table columns
  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: t('products.sku', 'SKU'),
      sortable: true,
      width: '120px',
    },
    {
      key: 'name',
      header: t('products.name', 'Name'),
      sortable: true,
      render: (product) => (
        <div>
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {product.name}
          </span>
          {product.barcode && (
            <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
              {product.barcode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: t('products.category', 'Category'),
      hideOnMobile: true,
      render: (product) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {product.category?.name || '-'}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('products.price', 'Price'),
      sortable: true,
      align: 'end',
      render: (product) => (
        <span dir="ltr" className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
          {formatCurrency(product.price)}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      header: t('products.stock', 'Stock'),
      align: 'end',
      hideOnMobile: true,
      render: (product) => (
        <span
          className="font-medium"
          style={{
            color:
              (product.stock_quantity || 0) <= product.min_stock_level
                ? 'var(--color-error-600)'
                : 'var(--color-gray-900)',
          }}
        >
          {product.stock_quantity ?? '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: t('products.status', 'Status'),
      align: 'center',
      width: '100px',
      render: (product) => (
        <Badge variant={product.is_active ? 'success' : 'default'} dot>
          {product.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
        </Badge>
      ),
    },
  ];

  // Row actions
  const rowActions = (product: Product) => (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
        <button
          onClick={() => {
            setEditingProduct(product);
            setIsFormOpen(true);
          }}
          className="btn btn-ghost p-2"
          title={t('common.edit', 'Edit')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => setDeleteId(product.id)}
          className="btn btn-ghost p-2"
          style={{ color: 'var(--color-error-600)' }}
          title={t('common.delete', 'Delete')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );

  // Category filter options
  const categoryOptions = [
    { value: '', label: t('common.all_categories', 'All Categories') },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  // Status filter options
  const statusOptions = [
    { value: 'all', label: t('common.all', 'All') },
    { value: 'active', label: t('common.active', 'Active') },
    { value: 'inactive', label: t('common.inactive', 'Inactive') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.products', 'Products')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="btn btn-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {t('categories.manage', 'Categories')}
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('products.add', 'Add Product')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('products.search_placeholder', 'Search by name, SKU, or barcode...')}
            />
          </div>

          {/* Category filter */}
          <div className="w-full lg:w-48">
            <Select
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val as number | null)}
              options={categoryOptions}
              clearable
            />
          </div>

          {/* Status filter */}
          <div className="w-full lg:w-36">
            <Select
              value={activeFilter}
              onChange={(val) => setActiveFilter((val as string) || 'all')}
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(product) => product.id}
          isLoading={isLoading}
          emptyIcon="📦"
          emptyTitle={t('products.empty', 'No products found')}
          emptyDescription={t('products.empty_desc', 'Add your first product to get started')}
          emptyAction={
            canCreate ? (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="btn btn-primary"
              >
                {t('products.add', 'Add Product')}
              </button>
            ) : undefined
          }
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          rowActions={canEdit || canDelete ? rowActions : undefined}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
        categories={categories}
        isLoading={isSaving}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoriesChange={loadCategories}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('products.delete_title', 'Delete Product')}
        message={t('products.delete_confirm', 'Are you sure you want to delete this product? This action cannot be undone.')}
        confirmText={t('common.delete', 'Delete')}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ProductsPage;
