/**
 * Report-related types
 */

export interface SalesReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_sales: number;
    total_revenue: number;
    total_discounts: number;
    average_sale: number;
    total_items_sold: number;
  };
  by_date: SalesDateData[];
  by_payment_method: PaymentMethodData[];
  by_category: CategorySalesData[];
  sales_by_category?: CategorySalesData[];
  top_products: TopProductData[];
}

export interface SalesDateData {
  date: string;
  sales_count: number;
  revenue: number;
  items_sold: number;
}

export interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}

export interface CategorySalesData {
  id?: number;
  category_id?: number | null;
  name?: string;
  category_name?: string;
  sales_count?: number;
  revenue?: number;
  total?: number;
  percentage?: number;
  items_sold?: number;
}

export interface TopProductData {
  product_id: number;
  product_name: string;
  sku: string;
  quantity_sold: number;
  revenue: number;
}

export interface InventoryReport {
  // Allow both nested and flat access
  summary?: {
    total_products: number;
    total_stock_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };
  // Flat access for convenience
  total_products?: number;
  total_stock_value?: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
  by_warehouse?: WarehouseStockData[];
  by_category?: CategoryStockData[];
  stock_by_category?: CategoryStockData[];
  low_stock_items?: LowStockItem[];
}

export interface WarehouseStockData {
  warehouse_id: number;
  warehouse_name: string;
  products_count: number;
  total_quantity: number;
  stock_value: number;
}

export interface CategoryStockData {
  id?: number;
  category_id?: number | null;
  name?: string;
  category_name?: string;
  products_count: number;
  total_quantity?: number;
  stock_value: number;
}

export interface LowStockItem {
  id?: number;
  product_id?: number;
  name?: string;
  product_name?: string;
  sku: string;
  quantity?: number;
  current_quantity?: number;
  min_stock_level: number;
  warehouse_id?: number;
  warehouse_name?: string;
}

export interface DashboardData {
  today: {
    sales_count: number;
    revenue: number;
    new_customers: number;
  };
  today_sales: number;
  today_orders: number;
  low_stock_count: number;
  active_users: number;
  trends: {
    sales_7_days: number[];
    revenue_7_days: number[];
  };
  low_stock_alert: number;
  pending_orders: number;
}

export interface ReportParams {
  from?: string;
  to?: string;
  date_from?: string;
  date_to?: string;
  warehouse_id?: number;
  category_id?: number;
}

/**
 * Cash Register Report types
 */
export interface CashRegisterReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_cash_in: number;
    total_cash_out: number;
    net_cash: number;
    opening_balance: number;
    closing_balance: number;
    transactions_count: number;
  };
  by_user?: CashByUserData[];
  transactions?: CashTransaction[];
}

export interface CashByUserData {
  user_id: number;
  user_name: string;
  cash_in: number;
  cash_out: number;
  transactions: number;
}

export interface CashTransaction {
  id: number;
  type: 'sale' | 'refund' | 'adjustment' | 'expense';
  amount: number;
  reference?: string;
  notes?: string;
  user_name: string;
  created_at: string;
}
