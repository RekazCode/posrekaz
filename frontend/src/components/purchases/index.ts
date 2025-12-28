/**
 * Purchase Components
 * Barrel exports
 * 
 * NOTE: Purchase Orders (PO) components are DEPRECATED.
 * The system now uses Purchase Invoices which immediately update stock.
 */

// Purchase Invoices - PRIMARY
export { InvoiceCreateModal } from './InvoiceCreateModal';
export { InvoiceDetailModal } from './InvoiceDetailModal';

// Supplier Returns - Still used
export { SupplierReturnModal } from './SupplierReturnModal';
export { SupplierQuickAddModal } from './SupplierQuickAddModal';

// DEPRECATED - Purchase Order components (kept for backward compatibility)
// These should NOT be used in new code
export { POCreateModal } from './POCreateModal';