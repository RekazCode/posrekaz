/**
 * Inventory Page - Full implementation
 * Stock levels display, low stock alerts, adjustments, transfers, and warehouse management
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks';
import {
  DataTable,
  SearchInput,
  Select,
  Badge,
  Modal,
  LoadingSpinner,
  ConfirmDialog,
} from '../components/ui';
import { FormField, FormActions, FormError } from '../components/forms';
import { TransferModal, WarehouseModal, ReconciliationQueue } from '../components';
import { inventoryApi, warehousesApi } from '../lib/apiClient';
import type {
  InventoryItem,
  Warehouse,
  InventoryParams,
  CreateAdjustmentData,
  AdjustmentReason,
  Adjustment,
  StockTransfer,
} from '../types';
import type { Column } from '../components/ui';

const adjustmentReasons: { value: AdjustmentReason; label: string }[] = [
  { value: 'stock_count', label: 'Stock Count' },
  { value: 'damage', label: 'Damaged Goods' },
  { value: 'theft', label: 'Theft/Loss' },
  { value: 'return', label: 'Customer Return' },
  { value: 'correction', label: 'Correction' },
  { value: 'initial', label: 'Initial Stock' },
  { value: 'other', label: 'Other' },
];

export function InventoryPage() {
  const { t, locale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canAdjust = hasPermission('inventory.adjust');
  const canTransfer = hasPermission('inventory.transfer');
  const canManageWarehouses = hasPermission('warehouses.manage');

  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<number | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjustment modal
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  // Transfer modal
  const [transferringItem, setTransferringItem] = useState<InventoryItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Warehouse modal
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [showWarehouseList, setShowWarehouseList] = useState(false);
  const [deletingWarehouseId, setDeletingWarehouseId] = useState<number | null>(null);

  // Reconciliation
  const [showReconciliation, setShowReconciliation] = useState(false);

  // Transfers list
  const [showTransfers, setShowTransfers] = useState(false);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<Adjustment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load inventory
  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: InventoryParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
        warehouse_id: warehouseFilter,
        low_stock_only: lowStockOnly || undefined,
      };

      const response = await inventoryApi.list(params);
      setInventory(response.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'Failed to load inventory'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, warehouseFilter, lowStockOnly, t]);

  // Load warehouses
  const loadWarehouses = useCallback(async () => {
    try {
      const data = await warehousesApi.list();
      setWarehouses(data);
    } catch {
      // Failed to load warehouses
    }
  }, []);

  // Load transfers
  const loadTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const response = await inventoryApi.transfers({ page: 1 });
      setTransfers(response.data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load transfers'));
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  // Delete warehouse
  const handleDeleteWarehouse = async () => {
    if (!deletingWarehouseId) return;
    try {
      await warehousesApi.delete(deletingWarehouseId);
      toast.success(t('warehouses.deleted', 'Warehouse deleted'));
      setDeletingWarehouseId(null);
      loadWarehouses();
    } catch {
      toast.error(t('error.delete_failed', 'Failed to delete warehouse'));
    }
  };

  // Load adjustment history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await inventoryApi.adjustments({ page: 1 });
      setHistoryItems(response.data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load history'));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, warehouseFilter, lowStockOnly]);

  // Table columns
  const columns: Column<InventoryItem>[] = [
    {
      key: 'sku',
      header: t('products.sku', 'SKU'),
      width: '120px',
      render: (item) => (
        <span className="font-mono text-sm" style={{ color: 'var(--color-gray-600)' }}>
          {item.product?.sku}
        </span>
      ),
    },
    {
      key: 'name',
      header: t('products.name', 'Product'),
      render: (item) => (
        <div>
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {item.product?.name}
          </span>
          {item.product?.barcode && (
            <div className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
              {item.product?.barcode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: t('inventory.warehouse', 'Warehouse'),
      hideOnMobile: true,
      render: (item) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {item.warehouse?.name || '-'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: t('inventory.quantity', 'Qty'),
      align: 'end',
      width: '100px',
      render: (item) => (
        <span
          className="font-semibold"
          style={{
            color: item.is_low_stock
              ? 'var(--color-error-600)'
              : 'var(--color-gray-900)',
          }}
        >
          {item.quantity}
        </span>
      ),
    },
    {
      key: 'available',
      header: t('inventory.available', 'Available'),
      align: 'end',
      hideOnMobile: true,
      width: '100px',
      render: (item) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {item.available_quantity}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('inventory.status', 'Status'),
      align: 'center',
      width: '120px',
      render: (item) => {
        if (item.quantity === 0) {
          return <Badge variant="danger" dot>{t('inventory.out_of_stock', 'Out of Stock')}</Badge>;
        }
        if (item.is_low_stock) {
          return <Badge variant="warning" dot>{t('inventory.low_stock', 'Low Stock')}</Badge>;
        }
        return <Badge variant="success" dot>{t('inventory.in_stock', 'In Stock')}</Badge>;
      },
    },
  ];

  // Row actions
  const rowActions = (item: InventoryItem) => (
    <div className="flex items-center justify-end gap-1">
      {canAdjust && (
        <button
          onClick={() => setAdjustingItem(item)}
          className="btn btn-ghost p-2"
          title={t('inventory.adjust', 'Adjust Stock')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}
      {canTransfer && item.available_quantity > 0 && (
        <button
          onClick={() => {
            setTransferringItem(item);
            setShowTransferModal(true);
          }}
          className="btn btn-ghost p-2"
          title={t('inventory.transfer', 'Transfer Stock')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}
    </div>
  );

  // Warehouse filter options
  const warehouseOptions = [
    { value: '', label: t('common.all_warehouses', 'All Warehouses') },
    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.inventory', 'Inventory')}
        </h1>
        <div className="flex flex-wrap gap-2">
          {canManageWarehouses && (
            <button
              onClick={() => setShowWarehouseList(true)}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t('inventory.warehouses', 'Warehouses')}
            </button>
          )}
          {canTransfer && (
            <button
              onClick={() => {
                setShowTransfers(true);
                loadTransfers();
              }}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {t('inventory.transfers', 'Transfers')}
            </button>
          )}
          <button
            onClick={() => setShowReconciliation(true)}
            className="btn btn-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {t('inventory.reconciliation', 'Reconciliation')}
          </button>
          <button
            onClick={() => {
              setShowHistory(true);
              loadHistory();
            }}
            className="btn btn-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('inventory.history', 'History')}
          </button>
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
              placeholder={t('inventory.search_placeholder', 'Search by product name or SKU...')}
            />
          </div>

          {/* Warehouse filter */}
          <div className="w-full lg:w-48">
            <Select
              value={warehouseFilter}
              onChange={(val) => setWarehouseFilter(val as number | null)}
              options={warehouseOptions}
              clearable
            />
          </div>

          {/* Low stock toggle */}
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--color-gray-300)' }}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary-600)' }}
            />
            <span style={{ color: 'var(--color-gray-700)' }}>
              {t('inventory.low_stock_only', 'Low stock only')}
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={inventory}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyIcon="📦"
          emptyTitle={t('inventory.empty', 'No inventory found')}
          emptyDescription={t('inventory.empty_desc', 'Stock data will appear here once products are added')}
          rowActions={canAdjust ? rowActions : undefined}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* Adjustment Modal */}
      <AdjustmentModal
        isOpen={adjustingItem !== null}
        onClose={() => setAdjustingItem(null)}
        item={adjustingItem}
        warehouses={warehouses}
        onSuccess={() => {
          setAdjustingItem(null);
          loadInventory();
        }}
      />

      {/* History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={t('inventory.history', 'Adjustment History')}
        size="xl"
      >
        {isLoadingHistory ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--color-gray-500)' }}>
            {t('inventory.no_history', 'No adjustments recorded yet')}
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((adj) => (
              <div
                key={adj.id}
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{ borderColor: 'var(--color-gray-200)' }}
              >
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                    {adj.product?.name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                    {adj.reason} • {adj.user?.name}
                  </div>
                  {adj.notes && (
                    <div className="text-sm" style={{ color: 'var(--color-gray-400)' }}>
                      {adj.notes}
                    </div>
                  )}
                </div>
                <div className="text-end">
                  <span
                    className="font-semibold"
                    style={{
                      color:
                        adj.type === 'increase'
                          ? 'var(--color-success-600)'
                          : adj.type === 'decrease'
                          ? 'var(--color-error-600)'
                          : 'var(--color-gray-900)',
                    }}
                  >
                    {adj.type === 'increase' ? '+' : adj.type === 'decrease' ? '-' : '='}{adj.quantity}
                  </span>
                  <div className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
                    {new Date(adj.created_at).toLocaleString(locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferringItem(null);
        }}
        preselectedItem={transferringItem}
        warehouses={warehouses}
        onSuccess={() => {
          setShowTransferModal(false);
          setTransferringItem(null);
          loadInventory();
        }}
      />

      {/* Warehouse Modal */}
      <WarehouseModal
        isOpen={showWarehouseModal}
        onClose={() => {
          setShowWarehouseModal(false);
          setEditingWarehouse(null);
        }}
        warehouse={editingWarehouse}
        onSuccess={() => {
          setShowWarehouseModal(false);
          setEditingWarehouse(null);
          loadWarehouses();
        }}
      />

      {/* Warehouse List Modal */}
      <Modal
        isOpen={showWarehouseList}
        onClose={() => setShowWarehouseList(false)}
        title={t('inventory.warehouses', 'Warehouses')}
        size="lg"
      >
        <div className="space-y-3">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingWarehouse(null);
                setShowWarehouseModal(true);
              }}
              className="btn btn-primary"
            >
              {t('inventory.add_warehouse', 'Add Warehouse')}
            </button>
          </div>
          {warehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{ borderColor: 'var(--color-gray-200)' }}
            >
              <div>
                <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {warehouse.name}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                  {warehouse.code} {warehouse.address && `• ${warehouse.address}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    warehouse.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {warehouse.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                </span>
                <button
                  onClick={() => {
                    setEditingWarehouse(warehouse);
                    setShowWarehouseModal(true);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title={t('common.edit', 'Edit')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeletingWarehouseId(warehouse.id)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                  title={t('common.delete', 'Delete')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Transfers List Modal */}
      <Modal
        isOpen={showTransfers}
        onClose={() => setShowTransfers(false)}
        title={t('inventory.transfers', 'Stock Transfers')}
        size="xl"
      >
        {isLoadingTransfers ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--color-gray-500)' }}>
            {t('inventory.no_transfers', 'No transfers recorded yet')}
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{ borderColor: 'var(--color-gray-200)' }}
              >
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                    {transfer.product?.name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                    {transfer.source_warehouse?.name} → {transfer.destination_warehouse?.name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-gray-400)' }}>
                    {t('inventory.quantity', 'Quantity')}: {transfer.quantity}
                    {transfer.notes && ` • ${transfer.notes}`}
                  </div>
                </div>
                <div className="text-end">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      transfer.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : transfer.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {transfer.status}
                  </span>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-gray-400)' }}>
                    {new Date(transfer.created_at).toLocaleString(locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Reconciliation Queue */}
      <ReconciliationQueue
        isOpen={showReconciliation}
        onClose={() => {
          setShowReconciliation(false);
          loadInventory();
        }}
      />

      {/* Delete Warehouse Confirmation */}
      <ConfirmDialog
        isOpen={deletingWarehouseId !== null}
        onClose={() => setDeletingWarehouseId(null)}
        onConfirm={handleDeleteWarehouse}
        title={t('inventory.delete_warehouse', 'Delete Warehouse')}
        message={t('inventory.delete_warehouse_confirm', 'Are you sure you want to delete this warehouse? This action cannot be undone.')}
        confirmLabel={t('common.delete', 'Delete')}
        variant="danger"
      />
    </div>
  );
}

// Adjustment Modal Component
interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  warehouses: Warehouse[];
  onSuccess: () => void;
}

function AdjustmentModal({ isOpen, onClose, item, warehouses, onSuccess }: AdjustmentModalProps) {
  const { t } = useLocaleStore();

  const [formData, setFormData] = useState<CreateAdjustmentData>({
    product_id: 0,
    warehouse_id: 0,
    quantity: 0,
    type: 'increase',
    reason: 'stock_count',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        quantity: 0,
        type: 'increase',
        reason: 'stock_count',
        notes: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [item, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.quantity <= 0 && formData.type !== 'set') {
      newErrors.quantity = t('validation.positive', 'Must be greater than 0');
    }
    if (formData.type === 'set' && formData.quantity < 0) {
      newErrors.quantity = t('validation.non_negative', 'Cannot be negative');
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
      await inventoryApi.adjust(formData);
      toast.success(t('inventory.adjusted', 'Stock adjusted successfully'));
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'Failed to save')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { value: 'increase', label: t('inventory.increase', 'Increase (+)') },
    { value: 'decrease', label: t('inventory.decrease', 'Decrease (-)') },
    { value: 'set', label: t('inventory.set', 'Set to Value') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('inventory.adjust_stock', 'Adjust Stock')}
      size="md"
    >
      {item && (
        <form onSubmit={handleSubmit}>
          {submitError && <FormError message={submitError} />}

          {/* Product info */}
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
              {item.product?.name}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              {t('inventory.current_stock', 'Current stock')}: <strong>{item.quantity}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <FormField label={t('inventory.adjustment_type', 'Type')}>
              <Select
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: (val as 'increase' | 'decrease' | 'set') || 'increase' })}
                options={typeOptions}
              />
            </FormField>

            {/* Quantity */}
            <FormField
              label={t('inventory.quantity', 'Quantity')}
              error={errors.quantity}
            >
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className={`input ${errors.quantity ? 'input-error' : ''}`}
              />
            </FormField>
          </div>

          {/* Warehouse */}
          <FormField label={t('inventory.warehouse', 'Warehouse')}>
            <Select
              value={formData.warehouse_id}
              onChange={(val) => setFormData({ ...formData, warehouse_id: val as number })}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </FormField>

          {/* Reason */}
          <FormField label={t('inventory.reason', 'Reason')}>
            <Select
              value={formData.reason}
              onChange={(val) => setFormData({ ...formData, reason: (val as AdjustmentReason) || 'stock_count' })}
              options={adjustmentReasons}
            />
          </FormField>

          {/* Notes */}
          <FormField label={t('inventory.notes', 'Notes')}>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
              className="input"
              rows={2}
              placeholder={t('inventory.notes_placeholder', 'Optional notes...')}
            />
          </FormField>

          {/* Preview */}
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <div className="text-sm" style={{ color: 'var(--color-primary-700)' }}>
              {t('inventory.new_stock', 'New stock will be')}:{' '}
              <strong>
                {formData.type === 'set'
                  ? formData.quantity
                  : formData.type === 'increase'
                  ? item.quantity + formData.quantity
                  : Math.max(0, item.quantity - formData.quantity)}
              </strong>
            </div>
          </div>

          <FormActions
            onCancel={onClose}
            isSubmitting={isLoading}
            submitLabel={t('inventory.apply', 'Apply Adjustment')}
          />
        </form>
      )}
    </Modal>
  );
}

export default InventoryPage;
