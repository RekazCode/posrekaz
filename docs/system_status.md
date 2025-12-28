# System Status - Purchase Module

**Last Updated:** 2024-12-24

## Purchase Module Status: ✅ COMPLETE (Redesigned)

The Purchase module has been completely redesigned from a **Purchase Order workflow** to a **Purchase Invoice workflow**.

---

## Summary of Changes

### What Was Removed

| Feature | Reason |
|---------|--------|
| Purchase Order creation | Replaced with Purchase Invoice |
| Draft status | Invoices are finalized on creation |
| "Send to supplier" action | Not applicable for invoices |
| "Approve" workflow | Not applicable for invoices |
| "Receive goods" workflow | Stock updates immediately on invoice creation |
| Partial receiving | No partial state needed |
| 7-status workflow | Only payment status matters now |

### What Was Added/Changed

| Feature | Description |
|---------|-------------|
| Purchase Invoice creation | Creates invoice and immediately updates stock |
| Payment status tracking | Tracks unpaid, partial, and paid invoices |
| Record Payment action | Record payments against invoices |
| Immediate stock updates | Stock increases atomically on invoice creation |
| Simplified UI | One-page form instead of multi-step wizard |

---

## Current System Behavior

### Creating a Purchase Invoice

1. User clicks "Record Purchase" button
2. User enters:
   - Supplier (required)
   - Warehouse (defaults to default warehouse)
   - Supplier invoice reference number (optional)
   - Invoice date
   - Items with quantities and unit costs
3. User submits the form
4. System (in single transaction):
   - Creates the purchase invoice record
   - Creates invoice item records
   - **Increases stock levels for each product**
   - Records stock movements for audit trail
5. Invoice is created with `payment_status = 'unpaid'`

### Payment Tracking

- Invoices have three payment statuses:
  - `unpaid` - No payment recorded
  - `partial` - Some payment recorded
  - `paid` - Full amount paid
- Users can record payments from the invoice detail view
- Payment status updates automatically based on paid amount vs total

### Stock Updates

- Stock is increased **immediately** when an invoice is created
- There is NO separate "receive goods" action
- Stock movements are recorded with type `purchase` and reference to the invoice
- Deleting an invoice does NOT reverse stock (use stock adjustments or returns)

---

## API Endpoints

### Active Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/purchase-invoices` | List all invoices |
| `POST` | `/api/purchase-invoices` | Create invoice (updates stock) |
| `GET` | `/api/purchase-invoices/{id}` | Get invoice details |
| `POST` | `/api/purchase-invoices/{id}/payment` | Record payment |
| `DELETE` | `/api/purchase-invoices/{id}` | Soft delete invoice |

### Deprecated Endpoints

The following endpoints have been **commented out** and should not be used:

| Method | Endpoint | Status |
|--------|----------|--------|
| `*` | `/api/purchase-orders/*` | ❌ DEPRECATED |

---

## Frontend Components

### Active Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PurchasesPage` | `pages/PurchasesPage.tsx` | Main purchases page |
| `InvoiceCreateModal` | `components/purchases/InvoiceCreateModal.tsx` | Create new invoice |
| `InvoiceDetailModal` | `components/purchases/InvoiceDetailModal.tsx` | View invoice & record payments |
| `SupplierReturnModal` | `components/purchases/SupplierReturnModal.tsx` | Return goods to supplier |

### Deprecated Components

| Component | Location | Status |
|-----------|----------|--------|
| `POCreateModal` | `components/purchases/POCreateModal.tsx` | ⚠️ DEPRECATED |
| `PODetailModal` | `components/purchases/PODetailModal.tsx` | ⚠️ DEPRECATED |
| `ReceiveGoodsModal` | `components/purchases/ReceiveGoodsModal.tsx` | ⚠️ DEPRECATED |

---

## Database Tables

### Active Tables

| Table | Purpose |
|-------|---------|
| `purchase_invoices` | Invoice headers |
| `purchase_invoice_items` | Invoice line items |

### Preserved (Historical Data)

| Table | Status |
|-------|--------|
| `purchase_orders` | Data preserved, no new records |
| `purchase_order_items` | Data preserved, no new records |

---

## Key Design Decisions

1. **Immediate Stock Updates**: Stock updates happen atomically within the invoice creation transaction. This ensures inventory accuracy and prevents the need for manual "receive" actions.

2. **No Draft State**: Invoices represent actual supplier invoices that have already occurred. There's no need for a "draft" state.

3. **Payment Tracking Only**: The only "workflow" is payment tracking. Invoices move from unpaid → partial → paid as payments are recorded.

4. **No Stock Reversal on Delete**: Deleting an invoice does NOT reverse stock changes. This is intentional - users should use stock adjustments or supplier returns to correct inventory.

5. **Supplier Reference Number**: The optional `supplier_invoice_number` field allows users to record the supplier's invoice reference for reconciliation.

---

## Testing Verification

To verify the system works correctly:

1. **Create Invoice Test**:
   - Create a purchase invoice with some items
   - Check that stock levels increased for those items
   - Check that stock movements were recorded

2. **Payment Test**:
   - View the invoice details
   - Record a partial payment
   - Verify status changes to "partial"
   - Record remaining payment
   - Verify status changes to "paid"

3. **No PO Access Test**:
   - Verify `/api/purchase-orders` returns 404
   - Verify old PO UI components are not accessible

---

## Migration Notes

### For Users with Existing Purchase Orders

Existing purchase order data in the database is preserved but not accessible through the UI. If needed:

1. Historical data can be viewed directly in the database
2. Use supplier returns to correct any inventory discrepancies
3. New purchases should be recorded as purchase invoices

### For Developers

- The `purchasesApi` in `apiClient.ts` now points to invoice endpoints
- Types in `types/purchase.ts` include invoice types
- PO-related components are deprecated but not removed (for reference)

---

*Document created: 2024-12-24*
*Status: Active*
