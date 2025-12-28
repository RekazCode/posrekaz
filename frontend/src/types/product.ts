/**
 * Product-related types
 */

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  products_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string | null;
  barcode: string | null;
  name: string;
  slug?: string;
  description: string | null;
  category_id: number | null;
  category?: Category;
  tax_class_id?: number | null;
  cost_price: number;
  price: number;
  stock_tracked?: boolean;
  min_stock_level: number;
  is_active: boolean;
  image_url: string | null;
  stock_quantity?: number;
  total_stock?: number;
  available_stock?: number;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

// Product type removed - backend doesn't use this field

export interface CreateProductData {
  sku?: string | null;
  barcode?: string | null;
  name: string;
  description?: string | null;
  category_id?: number | null;
  tax_class_id?: number | null;
  cost_price: number;
  price: number;
  stock_tracked?: boolean;
  min_stock_level?: number;
  is_active?: boolean;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number | null;
  is_active?: boolean;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface CreateCategoryData {
  name: string;
  description?: string | null;
  parent_id?: number | null;
  is_active?: boolean;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;
