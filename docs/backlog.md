# Prioritized Backlog (MoSCoW)

> **Last Updated:** December 18, 2025  
> **Backend Status:** ✅ ALL PHASES COMPLETE  
> **Frontend Status:** 🔄 NOT STARTED (See [frontend_execution_plan.md](frontend_execution_plan.md))

---

## Must Have (MVP - Phase 1-3) ✅ COMPLETE

### Authentication & Users ✅
- [x] User login/logout with JWT (Sanctum tokens)
- [x] Role-based access (Admin, Manager, Cashier, Warehouse, Accountant, Viewer)
- [x] Password reset
- [x] Audit logging (AuditService with full CRUD tracking)

### Products ✅
- [x] Product CRUD (simple type)
- [x] Categories (hierarchical with tree view)
- [x] Barcode support (EAN-13, EAN-8, UPC-A validation)
- [ ] Product variants (size/color) - **DEFERRED**

### Inventory ✅
- [x] Single warehouse stock tracking
- [x] Stock adjustments (add/deduct with reason)
- [x] Low stock alerts (min_stock_level on products)

### POS Core ✅
- [x] Product search (barcode/name)
- [x] Add to cart, quantity edit
- [x] Cash payment
- [x] Receipt printing (PDF via ReceiptService)
- [x] Offline queue with sync (OfflineSyncService)

---

## Should Have (Phase 4-5) ✅ COMPLETE

### Inventory ✅
- [x] Multi-warehouse support
- [x] Stock transfers (warehouse to warehouse)
- [ ] Batch/serial tracking - **DEFERRED**
- [ ] Expiry date tracking - **DEFERRED**

### Purchases ✅
- [x] Supplier management
- [x] Purchase orders (draft/sent/received/cancelled)
- [x] Receiving/returns (SupplierReturn workflow)

### Sales Enhancements ✅
- [ ] Customer selection - **DEFERRED** (MVP without customers)
- [x] Multiple payment methods (PaymentMethod model)
- [x] Split payments (multiple payments per sale)
- [x] Returns/refunds (sale refund with stock restoration)
- [ ] Held orders - **DEFERRED**

### Reporting ✅
- [x] Daily sales report
- [x] Stock valuation
- [x] Cash reconciliation
- [x] Sales by product/category
- [x] CSV export

---

## Could Have (Phase 6+) - PARTIALLY COMPLETE

### Advanced Features
- [ ] Promotions/discounts engine - **DEFERRED**
- [ ] Loyalty points - **DEFERRED**
- [ ] Price lists (retail/wholesale) - **DEFERRED**
- [ ] Bundle products - **DEFERRED**

### Integrations
- [ ] Card payment gateway - **DEFERRED**
- [ ] ESC/POS native printing - **DEFERRED**
- [ ] Cash drawer integration - **DEFERRED**

### CRM
- [ ] Customer profiles - **DEFERRED**
- [ ] Credit limits - **DEFERRED**
- [ ] Purchase history - **DEFERRED**

### Reporting
- [ ] Custom report builder - **DEFERRED**
- [ ] Scheduled email reports - **DEFERRED**
- [ ] Export to accounting - **DEFERRED**

### i18n & Deployment ✅
- [x] Arabic (AR) localization
- [x] English (EN) localization
- [x] RTL support
- [x] LYD currency (3 decimal precision)
- [x] Local deployment config (XAMPP)
- [x] Production deployment config

---

## Won't Have (Future Versions)

- [ ] eCommerce integration
- [ ] Multi-currency support
- [ ] Mobile app (native)
- [ ] Third-party shipping APIs
- [ ] SSO/OAuth enterprise
- [ ] GraphQL API
- [ ] Multi-tenancy / SaaS features

---

## Implementation Summary

| Phase | Status | Tests |
|-------|--------|-------|
| Phase 1: Foundation | ✅ COMPLETE | 30 passing |
| Phase 2: Products & Inventory | ✅ COMPLETE | 93 passing |
| Phase 3: POS & Sales | ✅ COMPLETE | 27 passing |
| Phase 4: Purchases & Suppliers | ✅ COMPLETE | 32 passing |
| Phase 5: Reports & Reconciliation | ✅ COMPLETE | 34 passing |
| Phase 6: Polish & Deployment | ✅ COMPLETE | 23 passing |
| **TOTAL** | **265 tests** | **852 assertions** |
