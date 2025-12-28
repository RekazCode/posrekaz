/**
 * System-related types (backend models not yet covered in frontend)
 */

// ============================================
// Payment (individual payment record for a sale)
// ============================================
export interface Payment {
  id: number;
  sale_id: number;
  payment_method_id: number;
  payment_method?: PaymentMethodFull;
  amount: number;
  tendered: number | null;
  change: number | null;
  reference: string | null;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
  updated_at: string;
}

// ============================================
// PaymentMethod (already exists in pos.ts, but adding full version)
// ============================================
export interface PaymentMethodFull {
  id: number;
  name: string;
  code: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
  is_active: boolean;
  is_default: boolean;
  requires_reference: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodData {
  name: string;
  code: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
  is_active?: boolean;
  is_default?: boolean;
  requires_reference?: boolean;
  sort_order?: number;
}

export type UpdatePaymentMethodData = Partial<CreatePaymentMethodData>;

// ============================================
// TaxClass (Tax rates and classifications)
// ============================================
export interface TaxClass {
  id: number;
  name: string;
  code: string;
  rate: number;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxClassData {
  name: string;
  code: string;
  rate: number;
  description?: string | null;
  is_active?: boolean;
  is_default?: boolean;
}

export type UpdateTaxClassData = Partial<CreateTaxClassData>;

// ============================================
// RefreshToken (for authentication)
// ============================================
export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// OfflineSyncLog (for offline mode tracking)
// ============================================
export type OfflineSyncStatus = 'pending' | 'synced' | 'failed' | 'duplicate';
export type OfflineSyncEntity = 'sale' | 'payment' | 'stock_adjustment';

export interface OfflineSyncLog {
  id: number;
  client_uuid: string;
  idempotency_key: string;
  entity_type: OfflineSyncEntity;
  entity_id: number | null;
  status: OfflineSyncStatus;
  request_payload: Record<string, unknown>;
  response_data: Record<string, unknown> | null;
  error_message: string | null;
  has_conflicts: boolean;
  conflicts: Record<string, unknown> | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfflineSyncConflict {
  id: number;
  sync_log_id: number;
  field: string;
  local_value: unknown;
  server_value: unknown;
  resolution: 'use_local' | 'use_server' | 'manual' | null;
  resolved_at: string | null;
}

// ============================================
// ProductImage (multiple images per product)
// ============================================
export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  image_url?: string; // Computed on backend
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductImageData {
  product_id: number;
  image: File | string; // File for upload or path
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

// ============================================
// StockLevel (inventory per warehouse)
// ============================================
export interface StockLevel {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number; // Computed: quantity - reserved_quantity
  product?: {
    id: number;
    sku: string;
    name: string;
    min_stock_level: number;
  };
  warehouse?: {
    id: number;
    name: string;
    code: string;
  };
  is_low_stock: boolean; // Computed
  updated_at: string;
}

// ============================================
// StockMovement (audit trail for inventory changes)
// ============================================
export type StockMovementType = 
  | 'adjustment'
  | 'purchase'
  | 'sale'
  | 'transfer_in'
  | 'transfer_out'
  | 'return'
  | 'supplier_return'
  | 'damage'
  | 'correction';

export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  type: StockMovementType;
  reason: string | null;
  reference_type: string | null; // e.g., 'Sale', 'PurchaseOrder'
  reference_id: number | null;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  warehouse?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface StockMovementParams {
  page?: number;
  per_page?: number;
  product_id?: number;
  warehouse_id?: number;
  type?: StockMovementType;
  date_from?: string;
  date_to?: string;
}

// ============================================
// Setting (system-wide settings - already partially in api.ts)
// ============================================
export interface SettingFull {
  id: number;
  key: string;
  value: string | null;
  type: 'string' | 'number' | 'boolean' | 'json';
  group: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Pagination helper
// ============================================
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
  };
}
