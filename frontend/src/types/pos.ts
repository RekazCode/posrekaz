/**
 * POS and Cart-related types
 */

export interface POSProduct {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  sale_price: number;
  image_url: string | null;
  category_id: number | null;
  available_quantity: number;
  is_active: boolean;
}

export interface CartItem {
  id: string; // UUID for cart item
  product: POSProduct;
  quantity: number;
  unit_price: number;
  discount: number;
  discount_type: 'fixed' | 'percentage';
  notes: string | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discount_type: 'fixed' | 'percentage';
  notes: string | null;
  created_at: Date;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  address: string | null;
}

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  is_active: boolean;
}

export interface CreateSaleData {
  idempotency_key: string;
  customer_id?: number | null;
  warehouse_id: number;
  items: SaleItemData[];
  payments: PaymentData[];
  discount?: number;
  discount_type?: 'fixed' | 'percentage';
  notes?: string | null;
}

export interface SaleItemData {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  discount_type?: 'fixed' | 'percentage';
}

export interface PaymentData {
  payment_method_id: number;
  amount: number;
  reference?: string | null;
}

// Cart calculations
export interface CartTotals {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  items_count: number;
  total_items: number;
}

// Common DateRange type for filters
export interface DateRange {
  start: string | null;
  end: string | null;
}

// Held cart for later recall
export interface HeldCart {
  id: string;
  name: string;
  cart: Cart;
  held_at: Date;
}
