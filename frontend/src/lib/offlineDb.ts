/**
 * Offline Database using Dexie.js (IndexedDB wrapper)
 * Phase F8: Offline & Sync
 */

import Dexie, { type Table } from 'dexie';

// ============================================
// Types for Offline Storage
// ============================================

export interface OfflineProduct {
  id: number;
  name: string;
  name_ar?: string;
  sku: string;
  barcode?: string;
  sale_price: number;
  cost_price: number;
  category_id?: number;
  category_name?: string;
  image_url?: string;
  is_active: boolean;
  track_stock: boolean;
  tax_rate?: number;
  cached_at: number; // timestamp
}

export interface OfflineCategory {
  id: number;
  name: string;
  name_ar?: string;
  parent_id?: number;
  cached_at: number;
}

export interface OfflineSale {
  id: string; // UUID for idempotency
  items: OfflineSaleItem[];
  customer_id?: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payments: OfflinePayment[];
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error_message?: string;
  created_at: number;
  synced_at?: number;
  retry_count: number;
}

export interface OfflineSaleItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_amount: number;
  total: number;
}

export interface OfflinePayment {
  method: string;
  amount: number;
  reference?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'sale' | 'adjustment' | 'customer';
  data: unknown;
  status: 'pending' | 'syncing' | 'failed';
  error_message?: string;
  created_at: number;
  retry_count: number;
  last_retry_at?: number;
}

export interface SyncStatus {
  id: string; // 'main'
  last_product_sync: number;
  last_category_sync: number;
  pending_count: number;
  is_syncing: boolean;
  last_sync_error?: string;
}

// ============================================
// Database Class
// ============================================

export class POSDatabase extends Dexie {
  products!: Table<OfflineProduct, number>;
  categories!: Table<OfflineCategory, number>;
  sales!: Table<OfflineSale, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  syncStatus!: Table<SyncStatus, string>;

  constructor() {
    super('POSOfflineDB');

    // Schema definition
    this.version(1).stores({
      products: 'id, sku, barcode, category_id, is_active, cached_at',
      categories: 'id, parent_id, cached_at',
      sales: 'id, status, created_at, synced_at',
      syncQueue: 'id, type, status, created_at, retry_count',
      syncStatus: 'id',
    });
  }
}

// Singleton instance
export const db = new POSDatabase();

// ============================================
// Database Helper Functions
// ============================================

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  await db.products.clear();
  await db.categories.clear();
  await db.sales.clear();
  await db.syncQueue.clear();
  await db.syncStatus.clear();
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus | undefined> {
  return db.syncStatus.get('main');
}

/**
 * Update sync status
 */
export async function updateSyncStatus(update: Partial<SyncStatus>): Promise<void> {
  const existing = await db.syncStatus.get('main');
  if (existing) {
    await db.syncStatus.update('main', update);
  } else {
    await db.syncStatus.put({
      id: 'main',
      last_product_sync: 0,
      last_category_sync: 0,
      pending_count: 0,
      is_syncing: false,
      ...update,
    });
  }
}

/**
 * Get pending sync count
 */
export async function getPendingSyncCount(): Promise<number> {
  const pendingSales = await db.sales.where('status').equals('pending').count();
  const pendingQueue = await db.syncQueue.where('status').equals('pending').count();
  return pendingSales + pendingQueue;
}

/**
 * Check if catalog is cached
 */
export async function isCatalogCached(): Promise<boolean> {
  const count = await db.products.count();
  return count > 0;
}

/**
 * Get cached products with optional filtering
 */
export async function getCachedProducts(options?: {
  categoryId?: number;
  search?: string;
  activeOnly?: boolean;
}): Promise<OfflineProduct[]> {
  let collection = db.products.toCollection();

  if (options?.activeOnly !== false) {
    collection = db.products.where('is_active').equals(1);
  }

  let products = await collection.toArray();

  if (options?.categoryId) {
    products = products.filter(p => p.category_id === options.categoryId);
  }

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchLower))
    );
  }

  return products;
}

/**
 * Get product by barcode from cache
 */
export async function getProductByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
  return db.products.where('barcode').equals(barcode).first();
}

/**
 * Cache products from API
 */
export async function cacheProducts(products: OfflineProduct[]): Promise<void> {
  const timestamp = Date.now();
  const productsWithTimestamp = products.map(p => ({
    ...p,
    cached_at: timestamp,
  }));

  await db.transaction('rw', db.products, async () => {
    await db.products.clear();
    await db.products.bulkPut(productsWithTimestamp);
  });

  await updateSyncStatus({ last_product_sync: timestamp });
}

/**
 * Cache categories from API
 */
export async function cacheCategories(categories: OfflineCategory[]): Promise<void> {
  const timestamp = Date.now();
  const categoriesWithTimestamp = categories.map(c => ({
    ...c,
    cached_at: timestamp,
  }));

  await db.transaction('rw', db.categories, async () => {
    await db.categories.clear();
    await db.categories.bulkPut(categoriesWithTimestamp);
  });

  await updateSyncStatus({ last_category_sync: timestamp });
}

/**
 * Save offline sale
 */
export async function saveOfflineSale(sale: Omit<OfflineSale, 'status' | 'retry_count' | 'created_at'>): Promise<string> {
  const offlineSale: OfflineSale = {
    ...sale,
    status: 'pending',
    retry_count: 0,
    created_at: Date.now(),
  };

  await db.sales.put(offlineSale);
  await updatePendingCount();
  return sale.id;
}

/**
 * Get pending offline sales
 */
export async function getPendingSales(): Promise<OfflineSale[]> {
  return db.sales.where('status').anyOf(['pending', 'failed']).toArray();
}

/**
 * Update sale sync status
 */
export async function updateSaleStatus(
  id: string,
  status: OfflineSale['status'],
  errorMessage?: string
): Promise<void> {
  const updates: Partial<OfflineSale> = { status };

  if (status === 'synced') {
    updates.synced_at = Date.now();
  }

  if (status === 'failed') {
    const sale = await db.sales.get(id);
    updates.retry_count = (sale?.retry_count || 0) + 1;
    updates.error_message = errorMessage;
  }

  await db.sales.update(id, updates);
  await updatePendingCount();
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'status' | 'retry_count' | 'created_at'>): Promise<void> {
  await db.syncQueue.put({
    ...item,
    status: 'pending',
    retry_count: 0,
    created_at: Date.now(),
  });
  await updatePendingCount();
}

/**
 * Update pending count in sync status
 */
async function updatePendingCount(): Promise<void> {
  const count = await getPendingSyncCount();
  await updateSyncStatus({ pending_count: count });
}

export default db;
