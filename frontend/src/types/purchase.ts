/**
 * Purchase order-related types
 */

export type POStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';

export interface Supplier {
  id: number;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  order_number: string; // Alias for display
  supplier_id: number;
  supplier?: Supplier;
  warehouse_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  status: POStatus;
  expected_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  total_amount: number; // Alias for display
  items_count: number;
  items?: POLineItem[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface POLineItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product?: {
    id: number;
    sku: string;
    name: string;
    barcode: string | null;
  };
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total: number;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: POLineItem[];
}

export interface POListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: POStatus;
  supplier_id?: number | null;
  warehouse_id?: number | null;
  date_from?: string;
  date_to?: string;
}

// Alias for consistency
export type PurchaseOrderListParams = POListParams;

export interface CreatePOData {
  supplier_id: number;
  warehouse_id: number;
  expected_date?: string | null;
  notes?: string | null;
  items: POItemData[];
}

export interface POItemData {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

// Supplier CRUD
export interface CreateSupplierData {
  name: string;
  code?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_number?: string | null;
  is_active?: boolean;
}

export type UpdateSupplierData = Partial<CreateSupplierData>;

// Update PO
export interface UpdatePOData {
  expected_date?: string | null;
  notes?: string | null;
  items?: POItemData[];
}

// Receive goods
export interface ReceiveItemData {
  purchase_order_item_id: number;
  quantity_received: number;
}

export interface ReceiveGoodsData {
  items: ReceiveItemData[];
  notes?: string | null;
}

// Supplier returns
export type ReturnStatus = 'pending' | 'shipped' | 'received' | 'cancelled';

export interface SupplierReturn {
  id: number;
  return_number: string;
  supplier_id: number;
  supplier?: Supplier;
  purchase_order_id: number | null;
  purchase_order?: PurchaseOrder;
  status: ReturnStatus;
  total_amount: number;
  reason: string | null;
  notes: string | null;
  items?: SupplierReturnItem[];
  created_at: string;
  updated_at: string;
}

export interface SupplierReturnItem {
  id: number;
  supplier_return_id: number;
  product_id: number;
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  quantity: number;
  unit_cost: number;
  total: number;
  reason: string | null;
}

export interface CreateSupplierReturnData {
  supplier_id: number;
  purchase_order_id?: number | null;
  reason?: string | null;
  notes?: string | null;
  items: {
    product_id: number;
    quantity: number;
    unit_cost: number;
    reason?: string | null;
  }[];
}

// ============================================
// Purchase Invoice Types
// ============================================

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_invoice_number: string | null;
  supplier_id: number;
  supplier?: Supplier;
  warehouse_id: number;
  warehouse?: {
    id: number;
    name: string;
  };
  created_by: number;
  creator?: {
    id: number;
    name: string;
  };
  subtotal: number;
  tax_total: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  invoice_date: string;
  due_date: string | null;
  paid_amount: number;
  payment_status: PaymentStatus;
  notes: string | null;
  items?: PurchaseInvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoiceItem {
  id: number;
  purchase_invoice_id: number;
  product_id: number;
  product?: {
    id: number;
    sku: string;
    name: string;
    barcode: string | null;
  };
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
  notes: string | null;
}

export interface PurchaseInvoiceWithItems extends PurchaseInvoice {
  items: PurchaseInvoiceItem[];
}

export interface PurchaseInvoiceListParams {
  page?: number;
  per_page?: number;
  search?: string;
  supplier_id?: number | null;
  warehouse_id?: number | null;
  payment_status?: PaymentStatus;
  from_date?: string;
  to_date?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface CreatePurchaseInvoiceData {
  supplier_id: number;
  warehouse_id?: number | null;
  supplier_invoice_number?: string | null;
  invoice_date?: string;
  due_date?: string | null;
  discount_amount?: number;
  shipping_cost?: number;
  notes?: string | null;
  items: PurchaseInvoiceItemData[];
}

export interface PurchaseInvoiceItemData {
  product_id: number;
  quantity: number;
  unit_cost: number;
  tax_rate?: number;
  discount_amount?: number;
  update_cost_price?: boolean;
  notes?: string | null;
}

export interface RecordPaymentData {
  amount: number;
  notes?: string | null;
}
