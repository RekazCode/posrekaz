/**
 * Offline Store - Zustand store for offline state management
 * Phase F8: Offline & Sync
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  db,
  getSyncStatus,
  updateSyncStatus,
  getPendingSyncCount,
  cacheProducts,
  cacheCategories,
  saveOfflineSale,
  getPendingSales,
  updateSaleStatus,
  isCatalogCached,
  getCachedProducts,
  type OfflineProduct,
  type OfflineCategory,
  type OfflineSale,
  type SyncStatus,
} from '../lib/offlineDb';
import api from '../lib/api';
import type { POSProduct, Category } from '../types';

// Extended type for offline sale creation with totals
export interface OfflineSaleInput {
  items: {
    product_id: number;
    product_name?: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax_amount?: number;
    total: number;
  }[];
  customer_id?: number | null;
  subtotal: number;
  discount_amount?: number;
  total: number;
  payments: {
    payment_method_id: number;
    amount: number;
    reference?: string | null;
  }[];
}

interface OfflineState {
  // Connection status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Sync status
  syncStatus: SyncStatus | null;
  isSyncing: boolean;
  pendingCount: number;

  // Catalog cache status
  isCatalogReady: boolean;
  isLoadingCatalog: boolean;
  lastCatalogSync: Date | null;

  // Actions
  initializeOffline: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  syncCatalog: () => Promise<void>;
  createOfflineSale: (saleData: OfflineSaleInput) => Promise<string>;
  syncPendingSales: () => Promise<{ synced: number; failed: number }>;
  getCachedProducts: (options?: { categoryId?: number; search?: string }) => Promise<OfflineProduct[]>;
  getCachedCategories: () => Promise<OfflineCategory[]>;
  getPendingSales: () => Promise<OfflineSale[]>;
  clearOfflineData: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  // Initial state
  isOnline: navigator.onLine,
  syncStatus: null,
  isSyncing: false,
  pendingCount: 0,
  isCatalogReady: false,
  isLoadingCatalog: false,
  lastCatalogSync: null,

  setIsOnline: (online) => {
    set({ isOnline: online });
    // Auto-sync when coming back online
    if (online && get().pendingCount > 0) {
      get().syncPendingSales();
    }
  },

  initializeOffline: async () => {
    // Check if catalog is already cached
    const hasCatalog = await isCatalogCached();
    const status = await getSyncStatus();

    set({
      isCatalogReady: hasCatalog,
      syncStatus: status || null,
      pendingCount: status?.pending_count || 0,
      lastCatalogSync: status?.last_product_sync
        ? new Date(status.last_product_sync)
        : null,
    });

    // Set up online/offline listeners
    window.addEventListener('online', () => get().setIsOnline(true));
    window.addEventListener('offline', () => get().setIsOnline(false));
  },

  refreshSyncStatus: async () => {
    const status = await getSyncStatus();
    const pendingCount = await getPendingSyncCount();

    set({
      syncStatus: status || null,
      pendingCount,
      lastCatalogSync: status?.last_product_sync
        ? new Date(status.last_product_sync)
        : null,
    });
  },

  syncCatalog: async () => {
    if (get().isLoadingCatalog) return;
    if (!get().isOnline) {
      throw new Error('Cannot sync catalog while offline');
    }

    set({ isLoadingCatalog: true });

    try {
      // Fetch products for offline use
      const productsResponse = await api.get<{ data: POSProduct[] }>('/pos/products');
      const products = productsResponse.data.data;

      // Transform to offline format - map POSProduct to OfflineProduct
      const offlineProducts: OfflineProduct[] = products.map((p) => ({
        id: p.id,
        name: p.name,
        name_ar: undefined,
        sku: p.sku,
        barcode: p.barcode || undefined,
        sale_price: p.sale_price,
        cost_price: 0, // Not available in POSProduct
        category_id: p.category_id || undefined,
        category_name: undefined,
        image_url: p.image_url || undefined,
        is_active: p.is_active,
        track_stock: true, // Default
        tax_rate: 0, // Default
        cached_at: Date.now(),
      }));

      await cacheProducts(offlineProducts);

      // Fetch categories
      const categoriesResponse = await api.get<{ data: Category[] }>('/categories/tree');
      const categories = categoriesResponse.data.data;

      const offlineCategories: OfflineCategory[] = categories.map((c) => ({
        id: c.id,
        name: c.name,
        name_ar: undefined,
        parent_id: c.parent_id || undefined,
        cached_at: Date.now(),
      }));

      await cacheCategories(offlineCategories);

      set({
        isCatalogReady: true,
        lastCatalogSync: new Date(),
      });

      await get().refreshSyncStatus();
    } finally {
      set({ isLoadingCatalog: false });
    }
  },

  createOfflineSale: async (saleData) => {
    const id = uuidv4();

    const offlineSale: Omit<OfflineSale, 'status' | 'retry_count' | 'created_at'> = {
      id,
      items: saleData.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name || '',
        sku: item.sku || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        tax_amount: item.tax_amount || 0,
        total: item.total,
      })),
      customer_id: saleData.customer_id || undefined,
      subtotal: saleData.subtotal,
      tax_amount: 0, // Tax is calculated per item
      discount_amount: saleData.discount_amount || 0,
      total: saleData.total,
      payments: saleData.payments.map((p) => ({
        method: p.payment_method_id.toString(),
        amount: p.amount,
        reference: p.reference || undefined,
      })),
    };

    await saveOfflineSale(offlineSale);
    await get().refreshSyncStatus();

    return id;
  },

  syncPendingSales: async () => {
    if (get().isSyncing) return { synced: 0, failed: 0 };
    if (!get().isOnline) return { synced: 0, failed: 0 };

    set({ isSyncing: true });
    await updateSyncStatus({ is_syncing: true });

    let synced = 0;
    let failed = 0;

    try {
      const pendingSales = await getPendingSales();

      for (const sale of pendingSales) {
        try {
          await updateSaleStatus(sale.id, 'syncing');

          // Convert to API format
          const apiSaleData = {
            idempotency_key: sale.id,
            customer_id: sale.customer_id,
            items: sale.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount,
            })),
            payments: sale.payments.map((p) => ({
              payment_method_id: parseInt(p.method, 10) || 1,
              amount: p.amount,
              reference: p.reference,
            })),
            subtotal: sale.subtotal,
            tax_amount: sale.tax_amount,
            discount_amount: sale.discount_amount,
            total: sale.total,
          };

          await api.post('/sales', apiSaleData);
          await updateSaleStatus(sale.id, 'synced');
          synced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          await updateSaleStatus(sale.id, 'failed', errorMessage);
          failed++;
        }
      }
    } finally {
      set({ isSyncing: false });
      await updateSyncStatus({ is_syncing: false });
      await get().refreshSyncStatus();
    }

    return { synced, failed };
  },

  getCachedProducts: async (options) => {
    return getCachedProducts({
      categoryId: options?.categoryId,
      search: options?.search,
      activeOnly: true,
    });
  },

  getCachedCategories: async () => {
    return db.categories.toArray();
  },

  getPendingSales: async () => {
    return getPendingSales();
  },

  clearOfflineData: async () => {
    await db.delete();
    await db.open();
    set({
      isCatalogReady: false,
      pendingCount: 0,
      syncStatus: null,
      lastCatalogSync: null,
    });
  },
}));

export default useOfflineStore;
