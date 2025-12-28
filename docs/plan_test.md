# Comprehensive Testing Plan for POS System

## Document Information
- **Version**: 1.0
- **Created**: December 21, 2025
- **Last Updated**: December 21, 2025
- **Author**: QA Engineering Team

---

## 1. Test Objectives and Scope

### 1.1 Objectives
- Validate all core POS functionality works correctly after recent fixes
- Ensure API contracts between frontend and backend are aligned
- Verify data integrity across all CRUD operations
- Confirm proper error handling and validation
- Test user experience flows end-to-end

### 1.2 Scope

#### In Scope
| Module | Features |
|--------|----------|
| Products | Create, Read, Update, Delete, Search, Toggle Active |
| POS | Product grid display, Cart operations, Checkout, Payments |
| Inventory | Stock levels, Adjustments, Transfers, Low stock alerts |
| Users | Create, Read, Update, Delete, Role assignment, Activation |
| Categories | CRUD operations, Tree structure |
| Sales | Create POS sale, View history, Receipts, Refunds |
| Suppliers | CRUD operations |
| Purchase Orders | Create, Receive, Cancel |
| Reports | Daily sales, Stock levels, Cash reconciliation |
| Authentication | Login, Logout, Token refresh |

#### Out of Scope
- Load/Performance testing (separate plan)
- Security penetration testing (separate plan)
- Hardware integration (printers, barcode scanners)

---

## 2. Test Categories

### 2.1 Unit Tests (Backend)
**Priority: HIGH**

| Test Suite | Description | Location |
|------------|-------------|----------|
| MoneyHelperTest | Currency formatting utilities | tests/Unit |
| StockServiceTest | Stock management logic | tests/Unit |
| UserServiceTest | User business logic | tests/Unit |
| AuditServiceTest | Audit logging | tests/Unit |
| BarcodeServiceTest | Barcode generation | tests/Unit |
| SkuServiceTest | SKU generation | tests/Unit |
| RolePermissionTest | RBAC logic | tests/Unit |

### 2.2 Feature Tests (Backend API)
**Priority: CRITICAL**

| Test Suite | Description | Endpoints Covered |
|------------|-------------|-------------------|
| ProductControllerTest | Product CRUD | /api/products |
| UserControllerTest | User management | /api/users |
| AuthControllerTest | Authentication | /api/auth/* |
| CategoryControllerTest | Categories | /api/categories |
| SaleTest | POS sales | /api/sales/* |
| StockControllerTest | Inventory | /api/stock/*, /api/inventory |
| WarehouseControllerTest | Warehouses | /api/warehouses |
| PurchaseOrderTest | Purchase orders | /api/purchase-orders |
| SupplierTest | Suppliers | /api/suppliers |
| ReportTest | Reports | /api/reports/* |
| RoleControllerTest | Roles/Permissions | /api/roles |

### 2.3 Integration Tests
**Priority: HIGH**

| Test Area | Description |
|-----------|-------------|
| API-Frontend Contract | Verify request/response formats match |
| Database Integrity | Foreign keys, cascades, constraints |
| Stock Movement Chain | Sale → Stock decrease → Movement log |
| User-Role-Permission | Complete RBAC flow |

### 2.4 End-to-End Tests (Frontend)
**Priority: HIGH**

| Test Suite | Description |
|------------|-------------|
| e2e.spec.ts | Core user flows |
| accessibility.spec.ts | WCAG compliance |
| visual-regression.spec.ts | UI consistency |

---

## 3. Functional Test Cases

### 3.1 Product Management

#### TC-PROD-001: Create Product (CRITICAL)
**Objective**: Verify product creation with correct payload
**Preconditions**: User logged in with products.create permission

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Products page | Products list displayed |
| 2 | Click "Add Product" button | Product form modal opens |
| 3 | Fill name: "Test Product" | Field accepts input |
| 4 | Fill price: 99.990 | Field accepts decimal |
| 5 | Fill cost_price: 50.000 | Field accepts decimal |
| 6 | Select category (optional) | Dropdown works |
| 7 | Click "Create" | Success toast, modal closes |
| 8 | Verify in product list | New product appears |

**API Validation**:
- Request: POST /api/products
- Payload: `{ name, price, cost_price, category_id?, sku?, barcode?, ... }`
- Response: 201 with product data

#### TC-PROD-002: Edit Product (CRITICAL)
**Objective**: Verify product update works
**Preconditions**: Product exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit on existing product | Edit modal opens with data |
| 2 | Change name to "Updated Product" | Field accepts input |
| 3 | Change price to 149.990 | Field accepts input |
| 4 | Click "Update" | Success toast, modal closes |
| 5 | Verify changes in list | Updated data shown |

**API Validation**:
- Request: PUT /api/products/{id}
- Response: 200 with updated product

#### TC-PROD-003: Delete Product (HIGH)
**Objective**: Verify soft delete works
**Preconditions**: Product exists with no sales

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete on product | Confirmation dialog |
| 2 | Confirm deletion | Success toast |
| 3 | Verify removed from list | Product not visible |
| 4 | Check database | deleted_at populated |

#### TC-PROD-004: Search Products (MEDIUM)
**Objective**: Verify search by name, SKU, barcode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type partial name in search | Filtered results |
| 2 | Type exact SKU | Matching product(s) |
| 3 | Type barcode | Matching product |
| 4 | Clear search | All products shown |

#### TC-PROD-005: Filter by Category (MEDIUM)
**Objective**: Verify category filtering

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select specific category | Only products in category |
| 2 | Select "All Categories" | All products shown |

#### TC-PROD-006: Toggle Active Status (MEDIUM)
**Objective**: Verify product activation/deactivation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle inactive product | Status changes to active |
| 2 | Verify in POS | Product appears |
| 3 | Toggle back to inactive | Status changes |
| 4 | Verify in POS | Product hidden |

---

### 3.2 POS Operations

#### TC-POS-001: Load Products (CRITICAL)
**Objective**: Verify POS product grid loads correctly
**Preconditions**: Active products exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to POS page | Page loads |
| 2 | Wait for products | Grid populated with products |
| 3 | Verify product info | Name, price displayed |
| 4 | Verify category tabs | Categories shown |

**API Validation**:
- Request: GET /api/pos/products
- Response: Array of products with sale_price

#### TC-POS-002: Add to Cart (CRITICAL)
**Objective**: Verify cart operations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click product card | Item added to cart |
| 2 | Verify cart shows item | Product in cart list |
| 3 | Verify quantity is 1 | Correct quantity |
| 4 | Click same product again | Quantity increases to 2 |
| 5 | Verify total updates | Correct calculation |

#### TC-POS-003: Cart Quantity Management (HIGH)
**Objective**: Verify quantity editing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click + button on cart item | Quantity increases |
| 2 | Click - button | Quantity decreases |
| 3 | Set quantity to 0 | Item removed |
| 4 | Enter quantity manually | Accepts valid number |

#### TC-POS-004: Complete Cash Sale (CRITICAL)
**Objective**: Verify full cash sale flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add items to cart | Cart populated |
| 2 | Click Checkout | Payment modal opens |
| 3 | Select Cash payment | Cash selected |
| 4 | Enter amount tendered | Change calculated |
| 5 | Click Complete | Sale processed |
| 6 | Verify success modal | Invoice number shown |

**API Validation**:
- Request: POST /api/sales/pos
- Response: 201 with sale data

#### TC-POS-005: Hold and Recall Sale (HIGH)
**Objective**: Verify hold/recall functionality

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add items to cart | Cart has items |
| 2 | Press F5 or click Hold | Sale held, cart cleared |
| 3 | Add different items | New cart |
| 4 | Press F6 or click Recall | Held sales modal |
| 5 | Select held sale | Original cart restored |

#### TC-POS-006: Search/Scan Product (HIGH)
**Objective**: Verify barcode scanning simulation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type barcode in search | Product found |
| 2 | Press Enter | Added to cart |
| 3 | Type partial name | Suggestions shown |

---

### 3.3 Inventory Management

#### TC-INV-001: View Inventory (CRITICAL)
**Objective**: Verify inventory listing works
**Preconditions**: Products with stock exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Inventory | Page loads |
| 2 | Verify product list | Products with quantities shown |
| 3 | Verify warehouse info | Warehouse names displayed |

**API Validation**:
- Request: GET /api/inventory
- Response: Paginated stock levels

#### TC-INV-002: Stock Adjustment (HIGH)
**Objective**: Verify stock can be adjusted

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click adjust on item | Adjustment modal opens |
| 2 | Enter quantity change | Field accepts input |
| 3 | Select reason | Dropdown works |
| 4 | Click Confirm | Stock updated |
| 5 | Verify new quantity | Correct calculation |

**API Validation**:
- Request: POST /api/stock/adjust
- Payload: `{ product_id, warehouse_id, quantity, reason }`

#### TC-INV-003: Low Stock Filter (MEDIUM)
**Objective**: Verify low stock alert filtering

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable "Low Stock Only" | Filtered to low stock items |
| 2 | Verify all shown items | quantity <= min_stock_level |

#### TC-INV-004: Stock Transfer (MEDIUM)
**Objective**: Verify transfer between warehouses
**Preconditions**: Multiple warehouses exist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click transfer on item | Transfer modal |
| 2 | Select destination warehouse | Valid options shown |
| 3 | Enter quantity | Validated against available |
| 4 | Confirm transfer | Stock moved |

---

### 3.4 User Management

#### TC-USER-001: Create User (CRITICAL)
**Objective**: Verify user creation with roles
**Preconditions**: Admin logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Users | User list shown |
| 2 | Click "Add User" | Form modal opens |
| 3 | Fill name, email, password | Fields accept input |
| 4 | Password: min 8 chars, mixed case, number | Validation passes |
| 5 | Select roles | Checkboxes work |
| 6 | Click Create | Success, user created |

**API Validation**:
- Request: POST /api/users
- Payload: `{ name, email, password, roles? }`
- Response: 201 with user data

#### TC-USER-002: Assign Roles (CRITICAL)
**Objective**: Verify role assignment works

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit existing user | Modal with current roles |
| 2 | Add/remove roles | Selections saved |
| 3 | Verify permissions | User has correct access |

**API Validation**:
- Request: POST /api/users/{id}/roles
- Payload: `{ roles: [1, 2] }`

#### TC-USER-003: Toggle Active Status (HIGH)
**Objective**: Verify user activation/deactivation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle user to inactive | Status changes |
| 2 | User tries to login | Login denied |
| 3 | Toggle back to active | Login works |

#### TC-USER-004: Self-Action Prevention (MEDIUM)
**Objective**: Verify user cannot delete/deactivate self

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to delete own account | Error, action blocked |
| 2 | Try to deactivate self | Error, action blocked |

---

### 3.5 Categories

#### TC-CAT-001: Category CRUD (HIGH)
**Objective**: Verify category management

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create category | Success |
| 2 | Edit category | Updated |
| 3 | Create child category | Parent-child link |
| 4 | Delete category | Soft deleted |

#### TC-CAT-002: Category Tree (MEDIUM)
**Objective**: Verify hierarchical display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Get categories tree | Nested structure |
| 2 | Verify parent-child | Correct nesting |

---

### 3.6 Sales & Reports

#### TC-SALE-001: View Sale History (HIGH)
**Objective**: Verify sales list and details

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Sales | List displayed |
| 2 | Click on sale | Details shown |
| 3 | View items | Line items correct |

#### TC-SALE-002: Generate Receipt (MEDIUM)
**Objective**: Verify receipt generation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View sale details | Receipt button visible |
| 2 | Click receipt | HTML receipt shown |

#### TC-REPORT-001: Daily Sales Report (MEDIUM)
**Objective**: Verify daily sales reporting

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Reports | Report options shown |
| 2 | Select Daily Sales | Report data loaded |
| 3 | Verify totals | Correct calculations |

---

## 4. Integration Test Cases

### 4.1 API Contract Tests

#### TC-API-001: Product API Contract
**Objective**: Verify frontend-backend alignment

| Aspect | Frontend Expects | Backend Provides | Status |
|--------|------------------|------------------|--------|
| List Products | `{ data: Product[], meta }` | ✓ Same | ✓ |
| Product.price | `number` | `price` field | ✓ Fixed |
| Create Product | `{ name, price, ... }` | Validates same | ✓ Fixed |

#### TC-API-002: User API Contract
**Objective**: Verify user management alignment

| Aspect | Frontend Sends | Backend Expects | Status |
|--------|----------------|-----------------|--------|
| Assign Roles | `{ roles: [] }` | `{ roles: [] }` | ✓ Fixed |
| Create User | `{ name, email, password }` | Same + optional roles | ✓ |

#### TC-API-003: POS API Contract
**Objective**: Verify POS products endpoint

| Aspect | Frontend Expects | Backend Provides | Status |
|--------|------------------|------------------|--------|
| Endpoint | GET /api/pos/products | ✓ Created | ✓ Fixed |
| Response | `POSProduct[]` | sale_price mapped | ✓ Fixed |

#### TC-API-004: Inventory API Contract
**Objective**: Verify inventory endpoint

| Aspect | Frontend Expects | Backend Provides | Status |
|--------|------------------|------------------|--------|
| Endpoint | GET /api/inventory | ✓ Created | ✓ Fixed |
| Response | `{ data, meta }` | Paginated | ✓ Fixed |

---

## 5. Edge Cases and Error Handling

### 5.1 Validation Edge Cases

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-001 | Create product with empty name | 422 error |
| EC-002 | Create product with negative price | 422 error |
| EC-003 | Create user with invalid email | 422 error |
| EC-004 | Create user with weak password | 422 error |
| EC-005 | Duplicate SKU | 422 error |
| EC-006 | Duplicate email | 422 error |
| EC-007 | Stock adjustment exceeds available | 400 error |
| EC-008 | Transfer to same warehouse | 422 error |

### 5.2 Permission Edge Cases

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-101 | Access admin page without permission | 403 Forbidden |
| EC-102 | Create product without permission | 403 Forbidden |
| EC-103 | Delete user without permission | 403 Forbidden |
| EC-104 | View reports without permission | 403 Forbidden |

### 5.3 Business Logic Edge Cases

| Test ID | Scenario | Expected |
|---------|----------|----------|
| EC-201 | Sale with inactive product | Product not shown |
| EC-202 | Sale exceeding stock (if tracked) | Warning/blocked |
| EC-203 | Delete category with products | Blocked or orphan |
| EC-204 | Delete warehouse with stock | Blocked |

---

## 6. Test Execution Priority

### Critical (Must Pass)
1. TC-PROD-001: Create Product
2. TC-PROD-002: Edit Product
3. TC-POS-001: Load Products
4. TC-POS-004: Complete Sale
5. TC-INV-001: View Inventory
6. TC-USER-001: Create User
7. TC-USER-002: Assign Roles

### High Priority
1. TC-PROD-003: Delete Product
2. TC-POS-002: Add to Cart
3. TC-POS-003: Quantity Management
4. TC-POS-005: Hold/Recall
5. TC-INV-002: Stock Adjustment
6. TC-USER-003: Toggle Active
7. TC-CAT-001: Category CRUD

### Medium Priority
1. TC-PROD-004: Search
2. TC-PROD-005: Filter
3. TC-POS-006: Barcode Search
4. TC-INV-003: Low Stock Filter
5. TC-SALE-001: Sale History
6. TC-REPORT-001: Reports

---

## 7. Test Environment

### Backend Requirements
- PHP 8.1+
- Laravel 10.x
- MySQL 8.0 or SQLite (testing)
- Composer dependencies installed

### Frontend Requirements
- Node.js 18+
- npm/pnpm
- Playwright for E2E tests

### Test Database
- SQLite in-memory for unit/feature tests
- Seeded test data for E2E

---

## 8. Acceptance Criteria

### Pass Criteria
- All CRITICAL tests pass
- All HIGH tests pass with minor issues documented
- No regression in existing functionality
- API response times < 500ms

### Fail Criteria
- Any CRITICAL test fails
- More than 2 HIGH priority tests fail
- Data integrity issues
- Security vulnerabilities

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database schema changes | High | Run migrations, verify |
| API contract changes | High | Contract tests |
| Permission misconfiguration | Medium | RBAC tests |
| Stock calculation errors | High | Unit tests for calculations |

---

## 10. Test Schedule

| Phase | Duration | Activities |
|-------|----------|------------|
| Setup | 10 min | Verify environment |
| Unit Tests | 15 min | Run PHPUnit |
| API Tests | 20 min | Test endpoints |
| Integration | 15 min | Verify contracts |
| E2E | 20 min | UI workflows |
| Report | 10 min | Document results |

**Total Estimated Time**: ~90 minutes

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-21 | Initial creation |
