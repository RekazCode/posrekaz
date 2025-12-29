/**
 * Extended API client with typed functions
 * Wraps the base axios instance with domain-specific API calls
 */

import api from './api';
import type {
  ApiResponse,
  Product,
  ProductListParams,
  CreateProductData,
  UpdateProductData,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  InventoryItem,
  InventoryParams,
  Adjustment,
  CreateAdjustmentData,
  Warehouse,
  CreateWarehouseData,
  UpdateWarehouseData,
  StockTransfer,
  CreateTransferData,
  ReconciliationItem,
  POSProduct,
  CreateSaleData,
  Sale,
  SaleWithItems,
  SaleListParams,
  Customer,
  PaymentMethod,
  TaxRate,
  User,
  Role,
  Permission,
  Supplier,
  CreateSupplierData,
  UpdateSupplierData,
  SupplierReturn,
  CreateSupplierReturnData,
  PurchaseInvoice,
  PurchaseInvoiceWithItems,
  PurchaseInvoiceListParams,
  CreatePurchaseInvoiceData,
  RecordPaymentData,
  SalesReport,
  InventoryReport,
  CashRegisterReport,
  DashboardData,
  ReportParams,
  AuditLog,
  AuditLogParams,
} from '../types';

// Pagination response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// ============================================
// Products API
// ============================================

export const productsApi = {
  list: async (params?: ProductListParams): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Product>>>('/products', { params });
    return response.data.data;
  },

  get: async (id: number): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  create: async (data: CreateProductData): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateProductData): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  findByBarcode: async (barcode: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/barcode/${barcode}`);
    return response.data.data;
  },
};

// ============================================
// Categories API
// ============================================

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories/tree');
    return response.data.data;
  },

  get: async (id: number): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateCategoryData): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// ============================================
// Inventory API
// ============================================

export const inventoryApi = {
  list: async (params?: InventoryParams): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<InventoryItem>>>('/inventory', { params });
    return response.data.data;
  },

  getByWarehouse: async (warehouseId: number): Promise<InventoryItem[]> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>(`/warehouses/${warehouseId}/stock`);
    return response.data.data;
  },

  adjust: async (data: CreateAdjustmentData): Promise<Adjustment> => {
    // Handle 'set' type by calling setStock endpoint
    if (data.type === 'set') {
      const response = await api.post<ApiResponse<Adjustment>>('/stock/set', {
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        quantity: data.quantity,
        reason: data.notes || data.reason,
      });
      return response.data.data;
    }
    
    // Convert type to quantity sign for adjust endpoint
    const quantity = data.type === 'decrease' ? -Math.abs(data.quantity) : Math.abs(data.quantity);
    
    const response = await api.post<ApiResponse<Adjustment>>('/stock/adjust', {
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      quantity,
      reason: data.notes || data.reason,
    });
    return response.data.data;
  },

  adjustments: async (params?: { page?: number; product_id?: number; warehouse_id?: number }): Promise<PaginatedResponse<Adjustment>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Adjustment>>>('/inventory/adjustments', { params });
    return response.data.data;
  },

  // Stock Transfers
  transfers: async (params?: { page?: number; status?: string }): Promise<PaginatedResponse<StockTransfer>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<StockTransfer>>>('/inventory/transfers', { params });
    return response.data.data;
  },

  createTransfer: async (data: CreateTransferData): Promise<StockTransfer> => {
    const response = await api.post<ApiResponse<StockTransfer>>('/inventory/transfers', data);
    return response.data.data;
  },

  completeTransfer: async (id: number): Promise<StockTransfer> => {
    const response = await api.post<ApiResponse<StockTransfer>>(`/inventory/transfers/${id}/complete`);
    return response.data.data;
  },

  cancelTransfer: async (id: number): Promise<StockTransfer> => {
    const response = await api.post<ApiResponse<StockTransfer>>(`/inventory/transfers/${id}/cancel`);
    return response.data.data;
  },

  // Reconciliation
  pendingReconciliations: async (): Promise<ReconciliationItem[]> => {
    const response = await api.get<ApiResponse<ReconciliationItem[]>>('/reconciliation/pending');
    return response.data.data;
  },

  resolveReconciliation: async (id: number, data: { action: 'accept' | 'adjust' | 'ignore'; notes?: string }): Promise<ReconciliationItem> => {
    const response = await api.post<ApiResponse<ReconciliationItem>>(`/reconciliation/${id}`, data);
    return response.data.data;
  },
};

// ============================================
// Warehouses API
// ============================================

export const warehousesApi = {
  list: async (): Promise<Warehouse[]> => {
    const response = await api.get<ApiResponse<Warehouse[]>>('/warehouses');
    return response.data.data;
  },

  get: async (id: number): Promise<Warehouse> => {
    const response = await api.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return response.data.data;
  },

  create: async (data: CreateWarehouseData): Promise<Warehouse> => {
    const response = await api.post<ApiResponse<Warehouse>>('/warehouses', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateWarehouseData): Promise<Warehouse> => {
    const response = await api.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  },
};

// ============================================
// POS API
// ============================================

export const posApi = {
  products: async (params?: { category_id?: number; search?: string }): Promise<POSProduct[]> => {
    const response = await api.get<ApiResponse<POSProduct[]>>('/pos/products', { params });
    return response.data.data;
  },

  createSale: async (data: CreateSaleData): Promise<Sale> => {
    const response = await api.post<ApiResponse<Sale>>('/sales/pos', data);
    return response.data.data;
  },

  customers: async (search?: string): Promise<Customer[]> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params: { search } });
    return response.data.data;
  },

  paymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>('/payment-methods');
    return response.data.data;
  },

  taxRates: async (): Promise<TaxRate[]> => {
    const response = await api.get<ApiResponse<TaxRate[]>>('/tax-rates');
    return response.data.data;
  },
};

// ============================================
// Sales API
// ============================================

export const salesApi = {
  list: async (params?: SaleListParams): Promise<PaginatedResponse<Sale>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Sale>>>('/sales', { params });
    return response.data.data;
  },

  get: async (id: number): Promise<SaleWithItems> => {
    const response = await api.get<ApiResponse<SaleWithItems>>(`/sales/${id}`);
    return response.data.data;
  },

  refund: async (id: number, data: { items: { sale_item_id: number; quantity: number }[]; reason: string }): Promise<Sale> => {
    const response = await api.post<ApiResponse<Sale>>(`/sales/${id}/refund`, data);
    return response.data.data;
  },

  void: async (id: number, reason: string): Promise<Sale> => {
    const response = await api.post<ApiResponse<Sale>>(`/sales/${id}/void`, { reason });
    return response.data.data;
  },

  receipt: async (id: number): Promise<{ html: string; invoice_number: string }> => {
    const response = await api.get<ApiResponse<{ html: string; invoice_number: string }>>(`/sales/${id}/receipt`);
    return response.data.data;
  },
};

// ============================================
// Users API
// ============================================

export const usersApi = {
  list: async (params?: { page?: number; per_page?: number; search?: string; is_active?: boolean }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return response.data.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: { name: string; email: string; password: string; phone?: string; locale?: 'en' | 'ar'; roles?: number[] }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<{ name: string; email: string; phone: string; locale: 'en' | 'ar'; password?: string }>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  toggleActive: async (id: number): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/toggle-active`);
    return response.data.data;
  },

  assignRoles: async (id: number, roleIds: number[]): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(`/users/${id}/roles`, { roles: roleIds });
    return response.data.data;
  },
};

// ============================================
// Roles API
// ============================================

export const rolesApi = {
  list: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse<Role>> => {
    const response = await api.get<ApiResponse<Role[]>>('/roles', { params });
    // Handle both paginated and non-paginated API responses
    const data = response.data.data;
    const meta = (response.data as unknown as { meta?: PaginatedResponse<Role>['meta'] }).meta || {
      current_page: 1,
      last_page: 1,
      per_page: data.length,
      total: data.length,
      from: 1,
      to: data.length,
    };
    return { data, meta };
  },

  get: async (id: number): Promise<Role> => {
    const response = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return response.data.data;
  },

  create: async (data: { name: string; description?: string; permission_ids: number[] }): Promise<Role> => {
    // Backend expects 'display_name' and 'permissions' instead of 'permission_ids'
    const payload = {
      name: data.name,
      display_name: data.name, // Use name as display_name
      description: data.description,
      permissions: data.permission_ids, // Rename to 'permissions'
    };
    const response = await api.post<ApiResponse<Role>>('/roles', payload);
    return response.data.data;
  },

  update: async (id: number, data: { name?: string; description?: string; permission_ids?: number[] }): Promise<Role> => {
    // Backend expects 'display_name' and 'permissions' instead of 'permission_ids'
    const payload: Record<string, any> = {};
    if (data.name !== undefined) {
      payload.name = data.name;
      payload.display_name = data.name; // Use name as display_name
    }
    if (data.description !== undefined) payload.description = data.description;
    if (data.permission_ids !== undefined) payload.permissions = data.permission_ids; // Rename to 'permissions'
    const response = await api.put<ApiResponse<Role>>(`/roles/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};

// ============================================
// Permissions API
// ============================================

export const permissionsApi = {
  list: async (): Promise<Permission[]> => {
    const response = await api.get<ApiResponse<Record<string, Permission[]>>>('/permissions');
    // Flatten grouped permissions into a single array
    const grouped = response.data.data;
    const flattened: Permission[] = [];
    Object.values(grouped).forEach((groupPermissions) => {
      flattened.push(...groupPermissions);
    });
    return flattened;
  },
};

// ============================================
// Purchase Invoices API - Stock updates immediately on creation
// This is the PRIMARY purchases API for the POS system.
// Purchase Orders have been deprecated in favor of Purchase Invoices.
// ============================================

export const purchasesApi = {
  /**
   * List all purchase invoices with pagination and filters.
   */
  list: async (params?: PurchaseInvoiceListParams): Promise<PaginatedResponse<PurchaseInvoice>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<PurchaseInvoice>>>('/purchase-invoices', { params });
    return response.data.data;
  },

  /**
   * Get a single purchase invoice with items.
   */
  get: async (id: number): Promise<PurchaseInvoiceWithItems> => {
    const response = await api.get<ApiResponse<PurchaseInvoiceWithItems>>(`/purchase-invoices/${id}`);
    return response.data.data;
  },

  /**
   * Create a new purchase invoice.
   * IMPORTANT: This immediately increases inventory stock for all items.
   */
  create: async (data: CreatePurchaseInvoiceData): Promise<PurchaseInvoice> => {
    const response = await api.post<ApiResponse<PurchaseInvoice>>('/purchase-invoices', data);
    return response.data.data;
  },

  /**
   * Record a payment against an invoice.
   */
  recordPayment: async (id: number, data: RecordPaymentData): Promise<PurchaseInvoice> => {
    const response = await api.post<ApiResponse<PurchaseInvoice>>(`/purchase-invoices/${id}/payment`, data);
    return response.data.data;
  },

  /**
   * Delete a purchase invoice (soft delete).
   * NOTE: Stock is NOT reversed on deletion. Use stock adjustments for corrections.
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchase-invoices/${id}`);
  },

  /**
   * Get all suppliers (convenience method).
   */
  suppliers: async (): Promise<Supplier[]> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Supplier>>>('/suppliers', { 
      params: { per_page: 1000 } 
    });
    return response.data.data.data;
  },
};

// Alias for backward compatibility (prefer purchasesApi)
export const purchaseInvoicesApi = purchasesApi;

// ============================================
// Suppliers API
// ============================================

export const suppliersApi = {
  list: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Supplier>>>('/suppliers', { params });
    return response.data.data;
  },

  listAll: async (): Promise<Supplier[]> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Supplier>>>('/suppliers', { 
      params: { per_page: 1000 } // Get all suppliers
    });
    return response.data.data.data;
  },

  get: async (id: number): Promise<Supplier> => {
    const response = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSupplierData): Promise<Supplier> => {
    const response = await api.post<ApiResponse<Supplier>>('/suppliers', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateSupplierData): Promise<Supplier> => {
    const response = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};

// ============================================
// Supplier Returns API
// ============================================

export const supplierReturnsApi = {
  list: async (params?: { page?: number; supplier_id?: number }): Promise<PaginatedResponse<SupplierReturn>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<SupplierReturn>>>('/supplier-returns', { params });
    return response.data.data;
  },

  get: async (id: number): Promise<SupplierReturn> => {
    const response = await api.get<ApiResponse<SupplierReturn>>(`/supplier-returns/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSupplierReturnData): Promise<SupplierReturn> => {
    const response = await api.post<ApiResponse<SupplierReturn>>('/supplier-returns', data);
    return response.data.data;
  },

  ship: async (id: number): Promise<SupplierReturn> => {
    const response = await api.post<ApiResponse<SupplierReturn>>(`/supplier-returns/${id}/ship`);
    return response.data.data;
  },

  complete: async (id: number): Promise<SupplierReturn> => {
    const response = await api.post<ApiResponse<SupplierReturn>>(`/supplier-returns/${id}/complete`);
    return response.data.data;
  },

  cancel: async (id: number): Promise<SupplierReturn> => {
    const response = await api.post<ApiResponse<SupplierReturn>>(`/supplier-returns/${id}/cancel`);
    return response.data.data;
  },
};

// ============================================
// Reports API
// ============================================

export const reportsApi = {
  sales: async (params: ReportParams): Promise<SalesReport> => {
    const response = await api.get<ApiResponse<SalesReport>>('/reports/sales', { params });
    return response.data.data;
  },

  salesSummary: async (params: ReportParams): Promise<SalesReport['summary']> => {
    const response = await api.get<ApiResponse<SalesReport['summary']>>('/reports/sales/summary', { params });
    return response.data.data;
  },

  inventory: async (params?: { warehouse_id?: number }): Promise<InventoryReport> => {
    const response = await api.get<ApiResponse<InventoryReport>>('/reports/inventory', { params });
    return response.data.data;
  },

  cashRegister: async (params: ReportParams): Promise<CashRegisterReport> => {
    const response = await api.get<ApiResponse<CashRegisterReport>>('/reports/cash-register', { params });
    return response.data.data;
  },

  export: async (type: 'sales' | 'inventory' | 'cash-register', params: ReportParams): Promise<Blob> => {
    const response = await api.get(`/reports/${type}/export`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
  metrics: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data.data;
  },
};

// ============================================
// Settings API
// ============================================

export interface Settings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  currency: string;
  timezone: string;
  default_locale: 'en' | 'ar';
  receipt_footer: string;
  low_stock_threshold: number;
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await api.get<ApiResponse<Settings>>('/settings');
    return response.data.data;
  },

  update: async (data: Partial<Settings>): Promise<Settings> => {
    const response = await api.put<ApiResponse<Settings>>('/settings', data);
    return response.data.data;
  },
};

// ============================================
// Audit API
// ============================================

export const auditApi = {
  list: async (params?: AuditLogParams): Promise<PaginatedResponse<AuditLog>> => {
    const response = await api.get<ApiResponse<{ data: AuditLog[]; meta: PaginatedResponse<AuditLog>['meta'] }>>('/audit-logs', { params });
    // Backend returns: { success, message, data: { data: [], meta: {} } }
    const responseData = response.data.data as unknown as { data: AuditLog[]; meta: PaginatedResponse<AuditLog>['meta'] };
    return {
      data: responseData.data,
      meta: responseData.meta,
    };
  },
};

// ============================================
// Customers API
// ============================================

export const customersApi = {
  list: async (params?: { page?: number; search?: string }): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params });
    return response.data.data;
  },

  get: async (id: number): Promise<Customer> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  create: async (data: Omit<Customer, 'id'>): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

// ============================================
// System API
// ============================================

// Types for Update System
export interface VersionInfo {
  current_version: string;
  latest_version: string;
  is_update_available: boolean;
  release_date?: string;
  changelog?: ChangelogEntry[];
  download_size?: string;
  requires_migration?: boolean;
  min_php_version?: string;
  breaking_changes?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'security' | 'improvement' | 'breaking';
  description: string;
}

export interface UpdateProgress {
  stage: 'idle' | 'checking' | 'downloading' | 'backing_up' | 'installing' | 'migrating' | 'completing' | 'done' | 'error';
  progress: number;
  message: string;
  details?: string;
}

export const systemApi = {
  info: async (): Promise<{
    php_version: string;
    laravel_version: string;
    environment: string;
    debug_mode: boolean;
    timezone: string;
    locale: string;
  }> => {
    const response = await api.get<ApiResponse<any>>('/system/info');
    return response.data.data;
  },

  /**
   * Check for available updates from the release server
   */
  checkForUpdates: async (): Promise<VersionInfo> => {
    const response = await api.get<ApiResponse<VersionInfo>>('/system/check-updates');
    return response.data.data;
  },

  /**
   * Get update progress (for polling during update)
   */
  getUpdateProgress: async (): Promise<UpdateProgress> => {
    const response = await api.get<ApiResponse<UpdateProgress>>('/system/update-progress');
    return response.data.data;
  },

  /**
   * Start the update process
   */
  update: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>('/system/update');
    return response.data.data;
  },

  /**
   * Download update package without installing
   */
  downloadUpdate: async (version?: string): Promise<{ success: boolean; message: string; path?: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string; path?: string }>>('/system/download-update', { version });
    return response.data.data;
  },

  /**
   * Rollback to previous version
   */
  rollback: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>('/system/rollback');
    return response.data.data;
  },

  /**
   * Get update log
   */
  updateLog: async (): Promise<{ success: boolean; log: string; file?: string }> => {
    const response = await api.get<ApiResponse<{ success: boolean; log: string; file?: string }>>('/system/update-log');
    return response.data.data;
  },

  /**
   * Clear application cache
   */
  clearCache: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>('/system/clear-cache');
    return response.data.data;
  },

  /**
   * Create database backup
   */
  backup: async (): Promise<{ success: boolean; message: string; output?: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string; output?: string }>>('/system/backup');
    return response.data.data;
  },

  /**
   * Get list of available backups
   */
  listBackups: async (): Promise<{ backups: Array<{ name: string; date: string; size: string }> }> => {
    const response = await api.get<ApiResponse<{ backups: Array<{ name: string; date: string; size: string }> }>>('/system/backups');
    return response.data.data;
  },

  /**
   * Restore from a specific backup
   */
  restoreBackup: async (backupName: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>('/system/restore', { backup: backupName });
    return response.data.data;
  },
};
