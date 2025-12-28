/**
 * Inventory-related types
 */

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  product?: {
    id: number;
    sku: string;
    name: string;
    barcode: string | null;
    min_stock_level: number;
  };
  warehouse?: Warehouse;
  is_low_stock: boolean;
  updated_at: string;
}

export type AdjustmentReason = 
  | 'stock_count'
  | 'damage'
  | 'theft'
  | 'return'
  | 'correction'
  | 'initial'
  | 'other';

export interface Adjustment {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  type: 'increase' | 'decrease' | 'set';
  reason: AdjustmentReason;
  notes: string | null;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  created_at: string;
}

export interface CreateAdjustmentData {
  product_id: number;
  warehouse_id: number;
  quantity: number;
  type: 'increase' | 'decrease' | 'set';
  reason: AdjustmentReason;
  notes?: string | null;
}

export interface InventoryParams {
  page?: number;
  per_page?: number;
  warehouse_id?: number | null;
  search?: string;
  low_stock_only?: boolean;
}

// Stock Transfer types
export interface StockTransfer {
  id: number;
  product_id: number;
  source_warehouse_id: number;
  destination_warehouse_id: number;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes: string | null;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  source_warehouse?: Warehouse;
  destination_warehouse?: Warehouse;
  created_at: string;
  completed_at: string | null;
}

export interface CreateTransferData {
  product_id: number;
  source_warehouse_id: number;
  destination_warehouse_id: number;
  quantity: number;
  notes?: string | null;
}

// Warehouse CRUD types
export interface CreateWarehouseData {
  name: string;
  code: string;
  address?: string | null;
  is_active?: boolean;
}

export type UpdateWarehouseData = Partial<CreateWarehouseData>;

// Reconciliation types
export interface ReconciliationItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  expected_quantity: number;
  actual_quantity: number;
  difference: number;
  status: 'pending' | 'resolved' | 'ignored';
  resolution_notes: string | null;
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  warehouse?: Warehouse;
  created_at: string;
  resolved_at: string | null;
}
