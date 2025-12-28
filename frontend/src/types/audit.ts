/**
 * Audit log-related types
 */

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'sale'
  | 'refund'
  | 'stock_adjust'
  | 'export'
  | 'import';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  action: AuditAction;
  auditable_type: string;
  auditable_id: number | null;
  // Aliases for UI convenience
  entity_type: string;
  entity_id: number | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogParams {
  page?: number;
  per_page?: number;
  search?: string;
  user_id?: number | null;
  action?: AuditAction;
  auditable_type?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
}
