/**
 * API Types for POS Frontend
 * Based on backend OpenAPI specification
 */

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  locale: 'en' | 'ar';
  is_active: boolean;
  roles: (string | Role)[];  // Can be string array or Role objects
  permissions: Permission[];  // Full permission objects
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
  is_system?: boolean;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions?: number[];
  permission_ids?: number[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: number[];
  permission_ids?: number[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  locale?: 'en' | 'ar';
  role_ids?: number[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  locale?: 'en' | 'ar';
  role_ids?: number[];
}

export interface Settings {
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  currency?: string;
  currency_symbol?: string;
  receipt_footer?: string;
  receipt_header?: string;
  low_stock_threshold?: number;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
  date_format?: string;
  allow_negative_stock?: boolean;
  require_customer?: boolean;
  print_receipt_auto?: boolean;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  group: string;
  description: string | null;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
  };
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

// Locale types
export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface LocaleInfo {
  current: Locale;
  supported: Locale[];
  is_rtl: boolean;
  direction: Direction;
  names: Record<Locale, string>;
  date_format: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
    decimals: number;
  };
}

export interface LocaleResponse {
  success: boolean;
  data: LocaleInfo;
}

export interface TranslationsResponse {
  success: boolean;
  data: {
    locale: Locale;
    direction: Direction;
    messages: Record<string, string>;
  };
}

// API Error type
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
