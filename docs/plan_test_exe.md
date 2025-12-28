# Executable Testing Guide for POS System

## Document Information
- **Version**: 1.0
- **Created**: December 21, 2025
- **Purpose**: Step-by-step test execution with commands and verification

---

## Prerequisites

### 1. Environment Verification

```bash
# Backend - Check PHP version
php -v
# Expected: PHP 8.1 or higher

# Backend - Check Laravel
cd backend
php artisan --version
# Expected: Laravel Framework 10.x

# Frontend - Check Node
node -v
# Expected: v18.x or higher

# Frontend - Check npm
npm -v
```

### 2. Dependencies Installation

```bash
# Backend dependencies
cd backend
composer install

# Frontend dependencies  
cd ../frontend
npm install
```

### 3. Database Setup (Testing)

```bash
cd backend
# Create test database (if using MySQL)
php artisan migrate --env=testing

# Or use SQLite in-memory (recommended for tests)
# Already configured in phpunit.xml
```

---

## Section 1: Backend Unit Tests

### 1.1 Run All Unit Tests

```bash
cd backend
php artisan test --testsuite=Unit
```

**Expected Output:**
```
PASS  Tests\Unit\MoneyHelperTest
PASS  Tests\Unit\StockServiceTest
PASS  Tests\Unit\UserServiceTest
...
Tests: X passed
```

### 1.2 Run Specific Unit Test

```bash
# Money Helper
php artisan test tests/Unit/MoneyHelperTest.php

# Stock Service
php artisan test tests/Unit/StockServiceTest.php

# User Service
php artisan test tests/Unit/UserServiceTest.php
```

### 1.3 Unit Test Verification Checklist

| Test | Command | Expected |
|------|---------|----------|
| MoneyHelper | `php artisan test tests/Unit/MoneyHelperTest.php` | PASS |
| StockService | `php artisan test tests/Unit/StockServiceTest.php` | PASS |
| UserService | `php artisan test tests/Unit/UserServiceTest.php` | PASS |
| AuditService | `php artisan test tests/Unit/AuditServiceTest.php` | PASS |
| BarcodeService | `php artisan test tests/Unit/BarcodeServiceTest.php` | PASS |
| SkuService | `php artisan test tests/Unit/SkuServiceTest.php` | PASS |

---

## Section 2: Backend Feature Tests (API)

### 2.1 Run All Feature Tests

```bash
cd backend
php artisan test --testsuite=Feature
```

### 2.2 Test Product Controller

```bash
php artisan test tests/Feature/ProductControllerTest.php
```

**Key Tests:**
- can_list_products
- can_create_product
- can_update_product
- can_delete_product
- validates_required_fields
- can_filter_by_category

### 2.3 Test User Controller

```bash
php artisan test tests/Feature/UserControllerTest.php
```

**Key Tests:**
- admin_can_list_all_users
- admin_can_create_user
- can_assign_roles_to_user
- cannot_delete_self

### 2.4 Test Stock Controller

```bash
php artisan test tests/Feature/StockControllerTest.php
```

### 2.5 Test Sale Controller

```bash
php artisan test tests/Feature/SaleTest.php
```

### 2.6 Feature Test Verification Checklist

| Test Suite | Command | Status |
|------------|---------|--------|
| Auth | `php artisan test tests/Feature/AuthControllerTest.php` | [ ] |
| Products | `php artisan test tests/Feature/ProductControllerTest.php` | [ ] |
| Users | `php artisan test tests/Feature/UserControllerTest.php` | [ ] |
| Categories | `php artisan test tests/Feature/CategoryControllerTest.php` | [ ] |
| Stock | `php artisan test tests/Feature/StockControllerTest.php` | [ ] |
| Sales | `php artisan test tests/Feature/SaleTest.php` | [ ] |
| Warehouses | `php artisan test tests/Feature/WarehouseControllerTest.php` | [ ] |
| Suppliers | `php artisan test tests/Feature/SupplierTest.php` | [ ] |
| PO | `php artisan test tests/Feature/PurchaseOrderTest.php` | [ ] |
| Reports | `php artisan test tests/Feature/ReportTest.php` | [ ] |

---

## Section 3: Manual API Testing

### 3.1 Start Backend Server

```bash
cd backend
php artisan serve --port=8000
```

### 3.2 Authentication Test

```bash
# Login to get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {...}
  }
}
```

**Save token for subsequent requests:**
```bash
export TOKEN="your_access_token_here"
```

### 3.3 Product API Tests

#### Test: List Products
```bash
curl -X GET http://localhost:8000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected:** 200 OK with paginated product list

#### Test: Create Product
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test Product API",
    "price": 99.99,
    "cost_price": 50.00,
    "is_active": true
  }'
```

**Expected:** 201 Created

#### Test: Create Product Validation Error
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "",
    "price": -10
  }'
```

**Expected:** 422 Unprocessable Entity with validation errors

### 3.4 POS Products API Test

```bash
curl -X GET http://localhost:8000/api/pos/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected:** 200 OK with array of POSProduct objects containing:
- id, sku, barcode, name, sale_price, image_url, category_id, available_quantity, is_active

### 3.5 Inventory API Test

```bash
curl -X GET http://localhost:8000/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected:** 200 OK with paginated inventory items

### 3.6 User API Tests

#### Test: Create User
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Password123",
    "roles": [1]
  }'
```

**Expected:** 201 Created

#### Test: Assign Roles
```bash
curl -X POST http://localhost:8000/api/users/2/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "roles": [1, 2]
  }'
```

**Expected:** 200 OK with updated user

---

## Section 4: Frontend E2E Tests

### 4.1 Install Playwright

```bash
cd frontend
npx playwright install
```

### 4.2 Run All E2E Tests

```bash
npm run test:e2e
# Or directly:
npx playwright test
```

### 4.3 Run Specific E2E Test

```bash
# POS tests
npx playwright test e2e.spec.ts --grep "POS"

# Accessibility
npx playwright test accessibility.spec.ts

# Visual regression
npx playwright test visual-regression.spec.ts
```

### 4.4 Run Tests with UI Mode

```bash
npx playwright test --ui
```

### 4.5 Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### 4.6 Generate Test Report

```bash
npx playwright show-report
```

---

## Section 5: Manual UI Testing

### 5.1 Start Development Servers

```bash
# Terminal 1: Backend
cd backend
php artisan serve

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5.2 Product Management Tests

#### Test PM-001: Create Product

1. Open browser: http://localhost:5173
2. Login with admin credentials
3. Navigate to Products menu
4. Click "Add Product" button
5. Fill form:
   - Name: "Manual Test Product"
   - Price: 149.990
   - Cost Price: 75.000
   - Category: Select any
6. Click "Create"
7. **Verify:**
   - [ ] Success toast appears
   - [ ] Modal closes
   - [ ] Product appears in list
   - [ ] Network tab shows 201 response

#### Test PM-002: Edit Product

1. Find product in list
2. Click edit icon
3. Change name to "Updated Manual Product"
4. Change price to 199.990
5. Click "Update"
6. **Verify:**
   - [ ] Success toast appears
   - [ ] Updated data in list
   - [ ] Network tab shows 200 response

#### Test PM-003: Delete Product

1. Find product in list
2. Click delete icon
3. Confirm in dialog
4. **Verify:**
   - [ ] Success toast
   - [ ] Product removed from list
   - [ ] Network tab shows 200 response

### 5.3 POS Tests

#### Test POS-001: Product Grid Loading

1. Navigate to POS page
2. **Verify:**
   - [ ] Product grid loads
   - [ ] Products display name and price
   - [ ] Category tabs visible
   - [ ] Network: GET /api/pos/products returns 200

#### Test POS-002: Add to Cart

1. Click on product card
2. **Verify:**
   - [ ] Item appears in cart
   - [ ] Quantity is 1
   - [ ] Total updates correctly
3. Click same product again
4. **Verify:**
   - [ ] Quantity increases to 2
   - [ ] Total doubles

#### Test POS-003: Complete Sale

1. Add items to cart
2. Click "Checkout"
3. Select "Cash"
4. Enter amount >= total
5. Click "Complete"
6. **Verify:**
   - [ ] Success modal appears
   - [ ] Invoice number shown
   - [ ] Cart clears
   - [ ] Network: POST /api/sales/pos returns 201

### 5.4 Inventory Tests

#### Test INV-001: View Inventory

1. Navigate to Inventory page
2. **Verify:**
   - [ ] Inventory list loads
   - [ ] Products with quantities shown
   - [ ] Warehouse column visible
   - [ ] Network: GET /api/inventory returns 200

#### Test INV-002: Filter Low Stock

1. Toggle "Low Stock Only" checkbox
2. **Verify:**
   - [ ] List filters to low stock items
   - [ ] All shown items have quantity <= min_stock_level

### 5.5 User Management Tests

#### Test USER-001: Create User

1. Navigate to Users page
2. Click "Add User"
3. Fill form:
   - Name: "Test Employee"
   - Email: "employee@test.com"
   - Password: "Password123"
   - Confirm Password: "Password123"
4. Select role(s)
5. Click "Create"
6. **Verify:**
   - [ ] Success toast
   - [ ] User in list
   - [ ] Network: POST /api/users returns 201
   - [ ] Roles assigned (POST /api/users/{id}/roles returns 200)

#### Test USER-002: Password Validation

1. Try to create user with:
   - Password: "abc" (too short)
2. **Verify:**
   - [ ] Validation error shown
   - [ ] Form not submitted

---

## Section 6: Database Verification

### 6.1 Check Product Created

```sql
-- MySQL/MariaDB
SELECT * FROM products WHERE name LIKE '%Test%' ORDER BY created_at DESC LIMIT 5;
```

### 6.2 Check Stock Movements

```sql
SELECT sm.*, p.name as product_name, w.name as warehouse_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN warehouses w ON sm.warehouse_id = w.id
ORDER BY sm.created_at DESC
LIMIT 10;
```

### 6.3 Check Sales

```sql
SELECT s.*, 
       (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count,
       u.name as cashier_name
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 10;
```

### 6.4 Check User Roles

```sql
SELECT u.name, u.email, GROUP_CONCAT(r.name) as roles
FROM users u
LEFT JOIN role_user ru ON u.id = ru.user_id
LEFT JOIN roles r ON ru.role_id = r.id
GROUP BY u.id
ORDER BY u.created_at DESC;
```

---

## Section 7: Error Detection Scripts

### 7.1 PHP Error Log Check

```bash
cd backend
tail -f storage/logs/laravel.log
```

### 7.2 Check for PHP Syntax Errors

```bash
cd backend
find app -name "*.php" -exec php -l {} \; 2>&1 | grep -v "No syntax errors"
```

### 7.3 Check Route Registration

```bash
cd backend
php artisan route:list --path=pos
php artisan route:list --path=inventory
php artisan route:list --path=users
php artisan route:list --path=products
```

### 7.4 TypeScript Check

```bash
cd frontend
npm run type-check
# Or:
npx tsc --noEmit
```

### 7.5 ESLint Check

```bash
cd frontend
npm run lint
```

---

## Section 8: Test Execution Log

### Date: ___________

### Unit Tests

| Test Suite | Result | Errors | Notes |
|------------|--------|--------|-------|
| MoneyHelperTest | [ ] Pass [ ] Fail | | |
| StockServiceTest | [ ] Pass [ ] Fail | | |
| UserServiceTest | [ ] Pass [ ] Fail | | |
| AuditServiceTest | [ ] Pass [ ] Fail | | |
| BarcodeServiceTest | [ ] Pass [ ] Fail | | |
| SkuServiceTest | [ ] Pass [ ] Fail | | |
| RolePermissionTest | [ ] Pass [ ] Fail | | |

### Feature Tests

| Test Suite | Result | Errors | Notes |
|------------|--------|--------|-------|
| AuthControllerTest | [ ] Pass [ ] Fail | | |
| ProductControllerTest | [ ] Pass [ ] Fail | | |
| UserControllerTest | [ ] Pass [ ] Fail | | |
| CategoryControllerTest | [ ] Pass [ ] Fail | | |
| StockControllerTest | [ ] Pass [ ] Fail | | |
| SaleTest | [ ] Pass [ ] Fail | | |
| WarehouseControllerTest | [ ] Pass [ ] Fail | | |
| SupplierTest | [ ] Pass [ ] Fail | | |
| PurchaseOrderTest | [ ] Pass [ ] Fail | | |
| ReportTest | [ ] Pass [ ] Fail | | |
| RoleControllerTest | [ ] Pass [ ] Fail | | |

### Manual Tests

| Test ID | Description | Result | Issues |
|---------|-------------|--------|--------|
| PM-001 | Create Product | [ ] Pass [ ] Fail | |
| PM-002 | Edit Product | [ ] Pass [ ] Fail | |
| PM-003 | Delete Product | [ ] Pass [ ] Fail | |
| POS-001 | Product Grid | [ ] Pass [ ] Fail | |
| POS-002 | Add to Cart | [ ] Pass [ ] Fail | |
| POS-003 | Complete Sale | [ ] Pass [ ] Fail | |
| INV-001 | View Inventory | [ ] Pass [ ] Fail | |
| INV-002 | Low Stock Filter | [ ] Pass [ ] Fail | |
| USER-001 | Create User | [ ] Pass [ ] Fail | |
| USER-002 | Password Validation | [ ] Pass [ ] Fail | |

---

## Section 9: Issue Tracking

### Issue Template

```markdown
### Issue: [Title]
**Test Case**: [ID]
**Severity**: Critical/High/Medium/Low
**Status**: Open/In Progress/Fixed/Verified

**Description**:
[Describe the issue]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Fix Applied**:
[Description of fix]

**File(s) Changed**:
- [ ] file1.php
- [ ] file2.tsx

**Verified By**: [Name]
**Date Fixed**: [Date]
```

---

## Section 10: Automated Test Script

Save as `run_all_tests.sh`:

```bash
#!/bin/bash

echo "=========================================="
echo "POS System Comprehensive Test Suite"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to run test and track result
run_test() {
    echo "Running: $1"
    if eval "$2"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
    echo ""
}

# Backend Tests
echo "--- Backend Unit Tests ---"
cd backend

run_test "Unit Tests" "php artisan test --testsuite=Unit"
run_test "Feature Tests" "php artisan test --testsuite=Feature"

# Syntax Check
echo "--- PHP Syntax Check ---"
run_test "PHP Syntax" "find app -name '*.php' -exec php -l {} \; 2>&1 | grep -q 'No syntax errors' || exit 0"

# Route Check
echo "--- Route Registration ---"
run_test "Routes" "php artisan route:list > /dev/null 2>&1"

# Frontend Tests
cd ../frontend
echo ""
echo "--- Frontend Tests ---"

run_test "TypeScript Check" "npx tsc --noEmit"
run_test "Lint Check" "npm run lint -- --quiet"

# E2E Tests (optional - requires servers running)
# run_test "E2E Tests" "npx playwright test"

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    exit 1
fi
```

### Windows PowerShell Version

Save as `run_all_tests.ps1`:

```powershell
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "POS System Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0

function Run-Test {
    param($Name, $Command)
    
    Write-Host "Running: $Name" -ForegroundColor Yellow
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PASSED" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "✗ FAILED" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host "✗ FAILED: $_" -ForegroundColor Red
        $script:failed++
    }
    Write-Host ""
}

# Backend Tests
Write-Host "--- Backend Unit Tests ---" -ForegroundColor Cyan
Set-Location backend

Run-Test "Unit Tests" "php artisan test --testsuite=Unit"
Run-Test "Feature Tests" "php artisan test --testsuite=Feature"

# Route Check
Write-Host "--- Route Registration ---" -ForegroundColor Cyan
Run-Test "POS Routes" "php artisan route:list --path=pos"
Run-Test "Inventory Routes" "php artisan route:list --path=inventory"

# Frontend Tests
Set-Location ../frontend
Write-Host ""
Write-Host "--- Frontend Tests ---" -ForegroundColor Cyan

Run-Test "TypeScript Check" "npx tsc --noEmit"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -gt 0) {
    exit 1
}
```

---

## Section 11: Continuous Testing Commands

### Quick Smoke Test
```bash
# Backend
cd backend && php artisan test tests/Feature/ProductControllerTest.php --filter can_create_product

# Frontend
cd frontend && npx tsc --noEmit
```

### Full Regression
```bash
cd backend && php artisan test
cd ../frontend && npm run test:e2e
```

### Watch Mode (Development)
```bash
# Backend (requires phpunit-watcher)
cd backend && ./vendor/bin/phpunit-watcher watch

# Frontend
cd frontend && npm run test:watch
```

---

## Document Updates Log

| Date | Section | Change | Author |
|------|---------|--------|--------|
| 2025-12-21 | All | Initial creation | QA Team |
| | | | |
