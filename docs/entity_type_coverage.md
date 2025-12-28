# Entity Type Coverage Report

تقرير شامل لمقارنة الكيانات (Models) في الـ Backend مع الأنواع (Types) في الـ Frontend

## Backend Models (23 entity)

| # | Backend Model | Frontend Type | File Location | Status | Notes |
|---|--------------|---------------|---------------|--------|-------|
| 1 | AuditLog | AuditLog | audit.ts | ✅ مغطى | كامل مع AuditAction types |
| 2 | Category | Category | product.ts | ✅ مغطى | مع CreateCategoryData, UpdateCategoryData |
| 3 | OfflineSyncLog | OfflineSyncLog | **system.ts** | ✅ تم إنشاؤه | جديد - يتضمن OfflineSyncStatus, OfflineSyncEntity |
| 4 | Payment | Payment | **system.ts** | ✅ تم إنشاؤه | جديد - payment records للـ sales |
| 5 | PaymentMethod | PaymentMethod | pos.ts | ✅ مغطى | نسخة مبسطة، تم إضافة PaymentMethodFull في system.ts |
| 6 | Permission | Permission | api.ts | ✅ مغطى | مع resource, action fields |
| 7 | Product | Product | product.ts | ✅ مغطى | كامل مع relationships |
| 8 | ProductImage | ProductImage | **system.ts** | ✅ تم إنشاؤه | جديد - صور متعددة للمنتج |
| 9 | PurchaseOrder | PurchaseOrder | purchase.ts | ✅ مغطى | مع PurchaseOrderItem |
| 10 | PurchaseOrderItem | PurchaseOrderItem | purchase.ts | ✅ مغطى | items تابعة للـ PurchaseOrder |
| 11 | RefreshToken | RefreshToken | **system.ts** | ✅ تم إنشاؤه | جديد - authentication tokens |
| 12 | Role | Role | api.ts | ✅ مغطى | مع permissions relationship |
| 13 | Sale | Sale | sale.ts | ✅ مغطى | كامل مع items, payments |
| 14 | SaleItem | SaleItem | sale.ts | ✅ مغطى | line items للـ sales |
| 15 | Setting | Settings | api.ts | ✅ مغطى | مبسطة، تم إضافة SettingFull في system.ts |
| 16 | StockLevel | StockLevel | **system.ts** | ✅ تم إنشاؤه | موجود في inventory.ts ولكن تم تحسينه |
| 17 | StockMovement | StockMovement | **system.ts** | ✅ تم إنشاؤه | موجود في inventory.ts ولكن تم إضافة تفاصيل |
| 18 | Supplier | Supplier | purchase.ts | ✅ مغطى | كامل مع relationships |
| 19 | SupplierReturn | SupplierReturn | purchase.ts | ✅ مغطى | مع SupplierReturnItem |
| 20 | SupplierReturnItem | SupplierReturnItem | purchase.ts | ✅ مغطى | items تابعة للـ SupplierReturn |
| 21 | TaxClass | TaxClass | **system.ts** | ✅ تم إنشاؤه | جديد - tax rates & classifications |
| 22 | User | User | api.ts | ✅ مغطى | كامل مع roles, permissions |
| 23 | Warehouse | Warehouse | inventory.ts | ✅ مغطى | كامل مع address details |

## Frontend Type Files (10 files)

| File | Entities Covered | Purpose |
|------|-----------------|---------|
| api.ts | User, Role, Permission, Settings, Auth | Authentication & authorization |
| audit.ts | AuditLog, AuditAction | Audit trail tracking |
| inventory.ts | Warehouse, StockLevel, StockTransfer, Adjustment | Warehouse & inventory management |
| pos.ts | POSProduct, Cart, PaymentMethod, TaxRate | Point of sale operations |
| product.ts | Product, Category, ProductImage | Product catalog |
| purchase.ts | PurchaseOrder, Supplier, SupplierReturn | Procurement & supplier management |
| report.ts | Dashboard stats, Reports | Reporting & analytics |
| sale.ts | Sale, SaleItem | Sales transactions |
| **system.ts** | **New file with 10 entities** | **System-level entities** |

## الكيانات الجديدة المضافة في system.ts

### 1. Payment
- سجلات الدفع الفردية لكل عملية بيع
- تتضمن: payment_method_id, amount, tendered, change, reference, status

### 2. PaymentMethodFull
- نسخة كاملة من PaymentMethod (النسخة المبسطة في pos.ts)
- تتضمن: type, is_active, is_default, requires_reference, sort_order

### 3. TaxClass
- معدلات الضرائب وتصنيفاتها
- تتضمن: name, code, rate, description, is_active, is_default

### 4. RefreshToken
- رموز تحديث المصادقة
- تتضمن: user_id, token, expires_at, revoked_at

### 5. OfflineSyncLog
- سجلات المزامنة للوضع غير المتصل
- تتضمن: client_uuid, idempotency_key, entity_type, status, conflicts

### 6. ProductImage
- صور متعددة للمنتج الواحد
- تتضمن: product_id, image_path, alt_text, is_primary, sort_order

### 7. StockLevel (Enhanced)
- مستويات المخزون لكل مستودع (تحسين للنسخة في inventory.ts)
- تتضمن: quantity, reserved_quantity, available_quantity, is_low_stock

### 8. StockMovement (Enhanced)
- سجل تدقيق لتغييرات المخزون (تحسين للنسخة في inventory.ts)
- تتضمن: StockMovementType (12 نوع), quantity_before, quantity_after, reference

### 9. SettingFull
- نسخة كاملة من Settings (النسخة المبسطة في api.ts)
- تتضمن: key, value, type, group, description

## Coverage Statistics

- **Total Backend Models**: 23
- **Covered in Frontend**: 23 (100%)
- **Newly Created Types**: 10 types في system.ts
- **Enhanced Types**: 2 (StockLevel, StockMovement)
- **Type Files**: 10 files (9 existing + 1 new)

## Type Enhancements

### الأنواع المُحسّنة:

1. **StockMovementType**: 12 نوع شامل
   - adjustment, purchase, sale, transfer_in, transfer_out
   - return, supplier_return, damage, correction, وغيرها

2. **OfflineSyncStatus**: إدارة حالات المزامنة
   - pending, synced, failed, duplicate

3. **OfflineSyncEntity**: أنواع الكيانات القابلة للمزامنة
   - sale, payment, stock_adjustment

## Next Steps for Complete Integration

### 1. API Client Methods
سيتم إضافة methods في apiClient.ts:
```typescript
// Payment methods
paymentApi.list(saleId)
paymentApi.create(saleId, data)

// Tax classes
taxClassApi.list()
taxClassApi.create(data)

// Product images
productImageApi.list(productId)
productImageApi.upload(productId, file)

// Stock movements
stockMovementApi.list(params)
stockMovementApi.getByProduct(productId)

// Offline sync
offlineSyncApi.list(status)
offlineSyncApi.sync(payload)
```

### 2. UI Components
المكونات التي قد تحتاج التحديث:
- `ProductForm`: إضافة multiple image upload
- `PaymentModal`: استخدام Payment types
- `TaxSettings`: إدارة TaxClass entities
- `OfflineStatus`: عرض OfflineSyncLog
- `StockHistory`: عرض StockMovement audit trail

### 3. Store Updates
تحديث Zustand stores:
- `useProductStore`: إضافة ProductImage state
- `usePaymentStore`: إضافة Payment records state
- `useOfflineStore`: إضافة OfflineSyncLog tracking

## Conclusion

تم تغطية جميع الـ 23 Model في الـ Backend بالكامل في الـ Frontend. تم إنشاء ملف system.ts جديد يحتوي على 10 كيانات إضافية لضمان التغطية الكاملة والاتساق بين الطبقات.

جميع الأنواع الآن متاحة للاستخدام في التطبيق عبر:
```typescript
import { Payment, TaxClass, ProductImage, StockMovement, ... } from '@/types';
```

---
Generated: 2025-01-XX
Status: ✅ Complete - 100% Coverage
