# Purchase Invoice Redesign Document

## Overview

This document outlines the redesign of the Purchases module from a Purchase Order workflow to a **Purchase Invoice workflow**. The system will now treat purchases as finalized supplier invoices that immediately affect inventory.

---

## 1. Data Flow

### 1.1 New Purchase Invoice Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Purchase Invoice Creation                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Input                                                          │
│  ─────────                                                           │
│  • Supplier selection                                                │
│  • Warehouse selection                                               │
│  • Invoice date                                                      │
│  • Supplier invoice number (optional reference)                      │
│  • Items: product, quantity, unit cost                               │
│  • Discounts, shipping, notes (optional)                             │
│                                                                      │
│           │                                                          │
│           ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              SINGLE ATOMIC TRANSACTION                         │  │
│  │                                                                │  │
│  │  1. Create purchase_invoice record                             │  │
│  │  2. Create purchase_invoice_items records                      │  │
│  │  3. For EACH item:                                             │  │
│  │     a. Increase stock_levels.quantity                          │  │
│  │     b. Create stock_movement (TYPE_PURCHASE)                   │  │
│  │     c. Optionally update product.cost_price                    │  │
│  │  4. Calculate and save totals                                  │  │
│  │  5. Set payment_status = 'unpaid'                              │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│           │                                                          │
│           ▼                                                          │
│  Result                                                              │
│  ──────                                                              │
│  • Invoice created with unique number (PI-YYYYMMDD-XXXX)            │
│  • Stock increased immediately                                       │
│  • Stock movements recorded for audit                                │
│  • Invoice ready for payment tracking                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Payment Recording Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Payment Recording                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Input                                                          │
│  ─────────                                                           │
│  • Invoice ID                                                        │
│  • Payment amount                                                    │
│  • Notes (optional)                                                  │
│                                                                      │
│           │                                                          │
│           ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  1. Add amount to paid_amount                                  │  │
│  │  2. Update payment_status:                                     │  │
│  │     - If paid_amount >= total → 'paid'                        │  │
│  │     - If paid_amount > 0 → 'partial'                          │  │
│  │     - Otherwise → 'unpaid'                                     │  │
│  │  3. Log audit entry                                            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. UI Flow

### 2.1 Main Purchases Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  🧾 Purchase Invoices                          [+ Record Purchase]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Search...    │  │ All Status ▼ │  │ All Suppliers│               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌────────┬────────┬────────┬────────┐                              │
│  │   X    │   Y    │   Z    │   W    │  Summary Stats               │
│  │ Unpaid │ Partial│  Paid  │ Total  │                              │
│  └────────┴────────┴────────┴────────┘                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Invoice #   │ Supplier   │ Date   │ Total   │ Status │ Actions│  │
│  ├─────────────┼────────────┼────────┼─────────┼────────┼────────┤  │
│  │ PI-...-0001 │ Supplier A │ 12/24  │ 500.000 │ Unpaid │ 👁 💳   │  │
│  │ PI-...-0002 │ Supplier B │ 12/23  │ 300.000 │ Paid   │ 👁      │  │
│  └─────────────┴────────────┴────────┴─────────┴────────┴────────┘  │
│                                                                      │
│  Actions: 👁 = View Details, 💳 = Record Payment                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Create Purchase Invoice Modal

**Single-page form (no wizard needed):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  🧾 Record Purchase                                            [X]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Supplier *          [Select supplier...        ▼] [+]              │
│  Warehouse *         [Main Warehouse            ▼]                  │
│  Supplier Invoice #  [________________]                             │
│  Invoice Date        [2024-12-24    ]                               │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│  Items                                                               │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  [🔍 Search products by name, SKU, barcode...]                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Product      │ Quantity │ Unit Cost │ Total    │ Remove      │   │
│  ├──────────────┼──────────┼───────────┼──────────┼─────────────┤   │
│  │ Product A    │ [  10  ] │ [ 5.000 ] │ 50.000   │ [X]         │   │
│  │ Product B    │ [  20  ] │ [ 3.500 ] │ 70.000   │ [X]         │   │
│  └──────────────┴──────────┴───────────┴──────────┴─────────────┘   │
│                                                                      │
│                                        Subtotal:    120.000 LYD     │
│                                        ─────────────────────────     │
│                                        Total:       120.000 LYD     │
│                                                                      │
│  ⚠️ Stock will be increased immediately upon saving                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                 ││
│  │ [Cancel]                              [💾 Save & Update Stock]  ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Invoice Detail Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Invoice #PI-20241224-0001                                     [X]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐  │
│  │ Supplier      │ Date          │ Payment       │ Total         │  │
│  │ Supplier A    │ Dec 24, 2024  │ 🟡 Partial    │ 500.000 LYD   │  │
│  └───────────────┴───────────────┴───────────────┴───────────────┘  │
│                                                                      │
│  Items                                                               │
│  ─────────────────────────────────────────────────────────────────  │
│  │ Product      │ Quantity │ Unit Cost │ Line Total               │  │
│  ├──────────────┼──────────┼───────────┼──────────────────────────┤  │
│  │ Product A    │ 10       │ 5.000     │ 50.000 LYD               │  │
│  │ Product B    │ 20       │ 3.500     │ 70.000 LYD               │  │
│  └──────────────┴──────────┴───────────┴──────────────────────────┘  │
│                                                                      │
│  Payment History                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  │ Date       │ Amount    │ Notes                                 │  │
│  ├────────────┼───────────┼───────────────────────────────────────┤  │
│  │ Dec 24     │ 100.000   │ Cash payment                          │  │
│  └────────────┴───────────┴───────────────────────────────────────┘  │
│                                                                      │
│  Paid: 100.000 / 500.000 LYD (Remaining: 400.000 LYD)               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [Close]                                      [💳 Record Payment]││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. API Responsibilities

### 3.1 Endpoints (Final Design)

| Method | Endpoint | Purpose | Stock Impact |
|--------|----------|---------|--------------|
| `GET` | `/api/purchase-invoices` | List all invoices | None |
| `POST` | `/api/purchase-invoices` | Create new invoice | **+Increases stock** |
| `GET` | `/api/purchase-invoices/{id}` | Get invoice details | None |
| `POST` | `/api/purchase-invoices/{id}/payment` | Record payment | None |
| `DELETE` | `/api/purchase-invoices/{id}` | Soft delete invoice | None* |

*Note: Deletion does NOT reverse stock. Use stock adjustments or supplier returns for corrections.

### 3.2 Create Invoice Request

```typescript
POST /api/purchase-invoices

{
  "supplier_id": 1,
  "warehouse_id": 1,
  "supplier_invoice_number": "INV-12345",  // optional
  "invoice_date": "2024-12-24",
  "due_date": "2025-01-24",                // optional
  "discount_amount": 0,                     // optional
  "shipping_cost": 0,                       // optional
  "notes": "Notes here",                    // optional
  "items": [
    {
      "product_id": 1,
      "quantity": 10,
      "unit_cost": 5.000,
      "tax_rate": 0,                        // optional
      "discount_amount": 0,                 // optional
      "update_cost_price": false            // optional
    }
  ]
}
```

### 3.3 Response

```typescript
{
  "success": true,
  "data": {
    "id": 1,
    "invoice_number": "PI-20241224-0001",
    "supplier_invoice_number": "INV-12345",
    "supplier_id": 1,
    "supplier": { "id": 1, "name": "Supplier A" },
    "warehouse_id": 1,
    "warehouse": { "id": 1, "name": "Main Warehouse" },
    "subtotal": "50.000",
    "tax_total": "0.000",
    "discount_amount": "0.000",
    "shipping_cost": "0.000",
    "total": "50.000",
    "invoice_date": "2024-12-24",
    "due_date": "2025-01-24",
    "paid_amount": "0.000",
    "payment_status": "unpaid",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product": { "id": 1, "sku": "SKU001", "name": "Product A" },
        "quantity": 10,
        "unit_cost": "5.000",
        "line_total": "50.000"
      }
    ],
    "created_at": "2024-12-24T10:00:00Z"
  },
  "message": "Purchase invoice created successfully. Stock updated."
}
```

---

## 4. Database Schema

### 4.1 Tables to KEEP (Already Correct)

#### `purchase_invoices`
```sql
CREATE TABLE purchase_invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(255) UNIQUE,          -- PI-YYYYMMDD-XXXX
    supplier_invoice_number VARCHAR(100) NULL,   -- Reference from supplier
    supplier_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    subtotal DECIMAL(12,3) DEFAULT 0,
    tax_total DECIMAL(12,3) DEFAULT 0,
    discount_amount DECIMAL(12,3) DEFAULT 0,
    shipping_cost DECIMAL(12,3) DEFAULT 0,
    total DECIMAL(12,3) DEFAULT 0,
    invoice_date DATE,
    due_date DATE NULL,
    paid_amount DECIMAL(12,3) DEFAULT 0,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    notes TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### `purchase_invoice_items`
```sql
CREATE TABLE purchase_invoice_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    purchase_invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,3),
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,3) DEFAULT 0,
    discount_amount DECIMAL(12,3) DEFAULT 0,
    line_total DECIMAL(12,3),
    notes TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 4.2 Tables to DEPRECATE (No Longer Used)

- `purchase_orders` - Keep in database for historical data, but no new records
- `purchase_order_items` - Keep in database for historical data

**Assumption**: We will NOT delete these tables to preserve any existing data, but the application will stop using them.

---

## 5. Removed Features

The following Purchase Order features are **explicitly removed**:

| Feature | Reason |
|---------|--------|
| Draft status | Invoices are finalized on creation |
| Send to supplier | Not applicable for invoices |
| Approve workflow | Not applicable for invoices |
| Receive goods | Stock updates immediately |
| Partial receiving | No partial state needed |
| Order status tracking | Only payment status matters |
| Cancel order | Use supplier returns instead |

---

## 6. Implementation Checklist

### Backend
- [ ] Keep `PurchaseInvoiceController` (already correct)
- [ ] Keep `PurchaseInvoiceService` (already correct)
- [ ] Remove PO routes from `api.php`
- [ ] Update translations if needed

### Frontend
- [ ] Rewrite `PurchasesPage.tsx` to use invoices
- [ ] Enhance `InvoiceCreateModal.tsx` as main create modal
- [ ] Create `InvoiceDetailModal.tsx` for viewing
- [ ] Create `RecordPaymentModal.tsx` for payments
- [ ] Remove `POCreateModal.tsx`
- [ ] Remove `PODetailModal.tsx`
- [ ] Remove `ReceiveGoodsModal.tsx`
- [ ] Update `apiClient.ts` - use invoice endpoints
- [ ] Update `types/purchase.ts` - invoice-based types
- [ ] Update navigation/translations

### Testing
- [ ] Create invoice → verify stock increases
- [ ] Record payment → verify payment status updates
- [ ] Delete invoice → verify stock NOT reversed
- [ ] Verify all PO endpoints return 404

---

## 7. Assumptions Made

1. **Historical PO data**: Existing purchase_orders data will remain in the database but won't be accessible through the new UI.

2. **Stock reversal**: Deleting an invoice does NOT reverse stock. Users must use stock adjustments or supplier returns for corrections.

3. **Payment tracking**: The system will track payments against invoices but won't integrate with a full accounting system.

4. **Supplier returns**: The existing `SupplierReturnModal` will continue to work for returning goods to suppliers.

5. **No multi-currency**: All amounts are in LYD with 3 decimal precision.

6. **Single warehouse per invoice**: Each invoice is associated with one warehouse.

---

*Document created: 2024-12-24*
*Status: Approved for Implementation*
