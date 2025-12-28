/**
 * Sale-related types
 */

import type { Customer, PaymentMethod } from './pos';

export type SaleStatus = 'completed' | 'refunded' | 'partial_refund' | 'void' | 'voided';

export interface Sale {
  id: number;
  invoice_number: string;
  receipt_number?: string;
  customer_id: number | null;
  customer?: Customer;
  warehouse_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  subtotal: number;
  discount_amount: number;
  discount_percent?: number;
  grand_total: number;
  total_amount?: number;
  items_count?: number;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product?: {
    id: number;
    sku: string;
    name: string;
    barcode: string | null;
  };
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  discount_amount: number;
  subtotal?: number;
  total: number;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  payment_method_id: number;
  payment_method?: PaymentMethod;
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  payments: SalePayment[];
}

export interface SaleListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: SaleStatus;
  customer_id?: number | null;
  user_id?: number | null;
  warehouse_id?: number | null;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface RefundData {
  items: RefundItemData[];
  reason: string;
}

export interface RefundItemData {
  sale_item_id: number;
  quantity: number;
}
