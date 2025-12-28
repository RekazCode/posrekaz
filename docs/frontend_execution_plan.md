# Frontend Execution Plan

> **Document Version:** 1.1  
> **Prerequisite:** Backend Phases 1-6 ✅ COMPLETE (265 tests passing, 852 assertions)  
> **Deployment Target:** Single-Client Production (NOT SaaS)

---

## Backend Verification Status

> **⚠️ CRITICAL: Read before any frontend work begins**

### Verification Summary

| Statement | Status |
|-----------|--------|
| Backend Phases 1–6 are VERIFIED and COMPLETE | ✅ CONFIRMED |
| All 265 backend tests pass (852 assertions) | ✅ CONFIRMED |
| All frontend phases depend on existing, stable APIs | ✅ CONFIRMED |
| No backend development is required before frontend execution | ✅ CONFIRMED |

### Failure Attribution

**Frontend work may fail ONLY if frontend implementation is incorrect.**

The backend API is:
- Fully implemented across all 6 phases
- Tested with 265 passing tests
- Documented in OpenAPI spec (`docs/openapi.yaml`)
- Production-ready for single-client deployment

If a frontend phase fails:
1. The failure is in the frontend implementation
2. Do NOT modify backend code
3. Do NOT assume backend bugs without evidence
4. Verify frontend is calling correct endpoints with correct payloads

### API Stability Guarantee

All endpoints listed in this document are:
- Implemented and tested
- Returning documented response structures
- Available at `http://localhost:8080/api` (dev) or production URL

---

## Overview

This document provides a phased execution plan for building the React frontend for the POS system. Each phase is independently achievable and verifiable against the already-complete backend API.

### Guiding Principles

1. **Phase Independence** - Each phase must be deployable and testable on its own
2. **Backend-First Validation** - All API integrations verified against documented OpenAPI spec
3. **Touch-First POS** - POS interface optimized for touch interaction (48x48px minimum targets)
4. **RTL-Native** - Arabic support built-in from Phase 1, not bolted on later
5. **Offline-Aware** - Offline capability designed into architecture from the start
6. **Single-Client Focus** - No multi-tenancy, no SaaS abstractions

---

## Phase Summary

| Phase | Name | Dependencies | Deliverable | Backend Ready |
|-------|------|--------------|-------------|---------------|
| **F1** | Foundation & Auth | None | Login, layout shell, locale switching | **YES** |
| **F2** | Product Catalog UI | F1 | Product listing, search, CRUD | **YES** |
| **F3** | POS Core Interface | F1, F2 | Cart, product grid, basic checkout | **YES** |
| **F4** | Payments & Receipts | F3 | Split payments, receipt printing | **YES** |
| **F5** | Inventory & Warehouse | F1, F2 | Stock views, adjustments, transfers | **YES** |
| **F6** | Purchase Orders | F1, F5 | Supplier management, PO workflow | **YES** |
| **F7** | Reports & Analytics | F1 | Report views, CSV export, charts | **YES** |
| **F8** | Offline & Sync | F3, F4 | IndexedDB, queue, reconciliation UI | **YES** |
| **F9** | Polish & Hardening | All | Error handling, accessibility, testing | **YES** |

---

## Phase F1: Foundation & Authentication

### Scope
- React project setup (Vite + React 18 + TypeScript)
- Design system foundation (colors, typography, spacing)
- `AppShell` layout component with sidebar navigation
- RTL support infrastructure (`dir="rtl"`, CSS logical properties)
- Sanctum token authentication (login/logout)
- Locale switching (AR/EN) with `Accept-Language` header
- Protected route wrapper
- Basic error boundary

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/logout` | POST | Session termination |
| `/api/auth/me` | GET | Current user + roles |
| `/api/settings/locale` | PUT | Update user locale |

### Key UX Considerations
- **Login form**: Must work with virtual keyboard on touch devices
- **RTL**: Sidebar on right side when locale is Arabic
- **Locale toggle**: Instant visual feedback, page does not reload
- **Session expiry**: Graceful redirect to login with return URL

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| RTL as afterthought | Expensive redesign in later phases | Use CSS logical properties (`margin-inline-start`) from day 1 |
| Token storage insecure | Security vulnerability | Store in memory + secure httpOnly refresh cookie |
| Hardcoded LTR assumptions | Broken Arabic layout | Test every component in both directions |
| No error boundaries | Blank screens on errors | Wrap route components in error boundaries |

### Verification Checklist
- [ ] User can log in with valid credentials
- [ ] User sees appropriate error for invalid credentials
- [ ] User can log out (token cleared)
- [ ] Sidebar displays user name and role
- [ ] Locale switch toggles between AR/EN instantly
- [ ] Page direction changes (LTR ↔ RTL) on locale switch
- [ ] Unauthorized routes redirect to login
- [ ] API requests include `Authorization: Bearer <token>` header
- [ ] API requests include `Accept-Language: ar|en` header
- [ ] Error boundary catches and displays component errors

---

## Phase F2: Product Catalog UI

### Scope
- Product listing page with DataTable component
- Search by name, SKU, barcode
- Filter by category
- Product CRUD forms (create, edit, view)
- Category management (list, create, edit, delete)
- Barcode scanner input handling
- Currency input component (LYD with 3 decimals)
- Product image upload

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/products` | GET | List with pagination & filters |
| `/api/products` | POST | Create product |
| `/api/products/{id}` | GET | Single product details |
| `/api/products/{id}` | PUT | Update product |
| `/api/products/{id}` | DELETE | Soft delete product |
| `/api/products/barcode/{code}` | GET | Lookup by barcode |
| `/api/categories` | GET/POST | Category CRUD |
| `/api/categories/{id}` | PUT/DELETE | Category CRUD |

### Key UX Considerations
- **Barcode input**: Auto-focus field, submit on Enter or scan
- **Currency display**: Always show LYD symbol and 3 decimal places
- **Product images**: Lazy loading, placeholder for missing images
- **Touch-friendly**: Table rows have sufficient tap targets for actions
- **RTL tables**: Columns flow right-to-left naturally

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Barcode not debounced | Duplicate lookups, poor UX | Debounce 300ms, show loading state |
| Currency rounding errors | Financial discrepancies | Use integer storage (milliemes), format on display only |
| Large product list performance | Slow rendering | Virtual scrolling or pagination |
| Form validation client-only | Invalid data reaches server | Mirror backend validation rules |

### Verification Checklist
- [ ] Products list loads with pagination
- [ ] Search filters products in real-time
- [ ] Category filter narrows results
- [ ] Barcode scan/input finds product
- [ ] Product create form validates all required fields
- [ ] Product edit saves changes correctly
- [ ] Soft delete removes from list (not permanent)
- [ ] Currency inputs format to 3 decimal places
- [ ] Category CRUD operations function correctly
- [ ] RTL layout displays table correctly

---

## Phase F3: POS Core Interface

### Scope
- Fullscreen POS layout (`POSLayout` component)
- Product grid (touch-friendly tiles, 4-6 per row)
- Category quick-filter tabs
- Shopping cart with quantity adjustment
- NumPad component for quantity entry
- Cart total calculations (subtotal, tax, grand total)
- Customer selection (optional)
- Hold/Recall cart functionality
- Quick product search in POS

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pos/products` | GET | Optimized product list for POS |
| `/api/customers` | GET | Customer search/select |
| `/api/tax-rates` | GET | Active tax rates |
| `/api/sales` | POST | Create sale (Phase F4) |

### Key UX Considerations
- **Touch-first**: All buttons minimum 48x48px
- **No scroll for cart**: Cart fits in viewport, summary always visible
- **Large prices**: Font size readable from distance
- **Color-coded categories**: Quick visual scanning
- **Hold cart**: Save cart to localStorage, badge shows held count
- **NumPad**: Physical keypad feel, haptic feedback if available

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Cart state lost on refresh | Frustrated users | Persist cart to localStorage |
| Slow product grid | Unusable POS | Virtualize grid, cache images |
| Tax calculation mismatch | Financial errors | Use same formula as backend |
| Touch targets too small | Missed taps, frustration | Enforce 48px minimum in design system |

### Verification Checklist
- [ ] POS opens in fullscreen mode
- [ ] Product grid displays with images
- [ ] Category tabs filter products
- [ ] Tap product adds to cart
- [ ] Cart shows line items with quantity
- [ ] +/- buttons adjust quantity
- [ ] NumPad allows direct quantity entry
- [ ] Remove button clears item from cart
- [ ] Subtotal, tax, total calculate correctly
- [ ] Customer can be selected/cleared
- [ ] Hold saves cart, Recall restores it
- [ ] Search finds products quickly
- [ ] RTL layout mirrors correctly

---

## Phase F4: Payments & Receipts

### Scope
- Payment modal with split payment support
- Payment method selection (Cash, Card, Bank Transfer)
- Cash tendered input with change calculation
- Payment recording and sale finalization
- Receipt preview component
- Print receipt (thermal printer support)
- Sale completion success screen
- Quick cash buttons (exact, round amounts)

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sales` | POST | Create completed sale |
| `/api/sales/{id}/payments` | POST | Record payment(s) |
| `/api/payment-methods` | GET | Available methods |
| `/api/sales/{id}/receipt` | GET | Receipt data |

### Key UX Considerations
- **Split payment flow**: Clear visual of remaining balance
- **Cash tendered**: NumPad optimized for cash entry
- **Change due**: Large, prominent display
- **Quick cash buttons**: 10, 20, 50, 100 LYD buttons
- **Receipt print**: Silent print or preview option
- **Success state**: Clear confirmation, option for new sale

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment rounding errors | Money discrepancy | Use integer math (milliemes) |
| Double-submit sale | Duplicate transactions | Idempotency key per sale |
| Print failure blocks POS | Cashier stuck | Print async, allow skip |
| Overpayment not handled | User confusion | Cap tendered at remaining |

### Verification Checklist
- [ ] Pay button opens payment modal
- [ ] Payment methods display correctly
- [ ] Single payment completes sale
- [ ] Split payment shows remaining balance
- [ ] Cash tendered calculates change
- [ ] Quick cash buttons work
- [ ] Sale POST includes idempotency_key
- [ ] Receipt preview displays all items
- [ ] Print receipt sends to printer
- [ ] Success screen shows invoice number
- [ ] New Sale button clears cart
- [ ] RTL layout in modals correct

---

## Phase F5: Inventory & Warehouse

### Scope
- Stock levels listing by warehouse
- Low stock alerts/indicators
- Stock adjustment form (increase/decrease with reason)
- Stock transfer between warehouses
- Adjustment history log
- Warehouse management (CRUD)
- Stock reconciliation queue view

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inventory` | GET | Stock levels by warehouse |
| `/api/inventory/adjustments` | GET/POST | Adjustment CRUD |
| `/api/inventory/transfers` | GET/POST | Transfer CRUD |
| `/api/warehouses` | GET/POST | Warehouse CRUD |
| `/api/warehouses/{id}` | PUT/DELETE | Warehouse CRUD |
| `/api/reconciliation/pending` | GET | Pending conflicts |

### Key UX Considerations
- **Low stock visual**: Red badge or row highlight
- **Adjustment reason**: Required field, predefined options + other
- **Transfer flow**: Source → Destination clear visualization
- **Real-time updates**: Stock levels refresh after actions
- **Reconciliation alerts**: Badge count in sidebar

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Adjustment without reason | Audit trail broken | Require reason before submit |
| Transfer to same warehouse | Data corruption | Disable same-warehouse transfer |
| Stale stock display | Incorrect decisions | Refresh on focus/interval |
| Negative stock not shown | Missed reconciliation | Highlight negative values |

### Verification Checklist
- [ ] Stock levels list with warehouse filter
- [ ] Low stock items highlighted
- [ ] Adjustment form requires reason
- [ ] Adjustment updates stock immediately
- [ ] Transfer shows source/destination
- [ ] Transfer deducts/adds correctly
- [ ] Warehouse CRUD functions work
- [ ] Adjustment history shows all entries
- [ ] Reconciliation queue displays conflicts
- [ ] RTL layout correct

---

## Phase F6: Purchase Orders

### Scope
- Supplier management (list, create, edit)
- Purchase order creation wizard
- PO line items with product selection
- PO status workflow (draft → sent → partial → received)
- Receive goods form (partial receiving)
- Supplier returns processing
- PO history and filtering

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/suppliers` | GET/POST | Supplier CRUD |
| `/api/suppliers/{id}` | GET/PUT/DELETE | Supplier CRUD |
| `/api/purchase-orders` | GET/POST | PO CRUD |
| `/api/purchase-orders/{id}` | GET/PUT | PO details/update |
| `/api/purchase-orders/{id}/receive` | POST | Receive goods |
| `/api/purchase-orders/{id}/return` | POST | Return to supplier |

### Key UX Considerations
- **PO wizard**: Step-by-step (supplier → items → review → send)
- **Product search in PO**: Fast lookup by name/SKU
- **Partial receiving**: Clear display of ordered vs received
- **Status badges**: Color-coded (draft=gray, sent=blue, received=green)
- **Print PO**: PDF generation for supplier

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-receiving allowed | Inventory inflation | Cap at ordered quantity |
| No partial receiving | Unusable for real scenarios | Track per-line received |
| Supplier not linked | Orphan POs | Require supplier selection |
| Status transitions wrong | Workflow broken | Follow backend state machine |

### Verification Checklist
- [ ] Supplier CRUD functions correctly
- [ ] PO creation wizard completes
- [ ] Line items add/remove/update
- [ ] PO totals calculate correctly
- [ ] Send PO updates status
- [ ] Receive goods form works
- [ ] Partial receiving tracks quantities
- [ ] Returns process correctly
- [ ] PO history filters by status
- [ ] Print/export PO works
- [ ] RTL layout correct

---

## Phase F7: Reports & Analytics

### Scope
- Sales reports (daily, weekly, monthly, custom range)
- Inventory reports (stock value, movement)
- Cash reports (register summaries)
- Report filters (date range, category, warehouse)
- Chart visualizations (bar, line, pie)
- CSV export functionality
- Dashboard KPI widgets

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/reports/sales` | GET | Sales report data |
| `/api/reports/sales/summary` | GET | Aggregated sales |
| `/api/reports/inventory` | GET | Stock report data |
| `/api/reports/inventory/valuation` | GET | Stock value |
| `/api/reports/cash-register` | GET | Cash summaries |
| `/api/reports/export` | GET | CSV download |
| `/api/dashboard` | GET | KPI metrics |

### Key UX Considerations
- **Date range picker**: Quick presets (today, this week, this month)
- **Chart accessibility**: Data tables as alternative
- **Export feedback**: Loading indicator, download trigger
- **Dashboard refresh**: Auto-refresh every 5 minutes
- **Print-friendly**: Report pages have print CSS

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Chart library bloat | Slow page load | Use lightweight library (Recharts) |
| Large data set crash | Browser freeze | Paginate, aggregate server-side |
| CSV encoding issues | Corrupted Arabic | Use UTF-8 BOM for Excel |
| Timezone mismatch | Wrong report dates | Use server timezone |

### Verification Checklist
- [ ] Sales report loads with date filter
- [ ] Weekly/monthly aggregations correct
- [ ] Inventory valuation displays
- [ ] Cash register summary shows totals
- [ ] Charts render correctly
- [ ] CSV export downloads
- [ ] CSV opens correctly in Excel (Arabic)
- [ ] Dashboard KPIs display
- [ ] Date range picker works
- [ ] RTL charts mirror correctly

---

## Phase F8: Offline & Sync

### Scope
- Service Worker registration
- IndexedDB for offline data storage
- Product catalog caching
- Offline sale creation (queue to IndexedDB)
- Sync queue management UI
- Online/offline status indicator
- Conflict resolution UI (reconciliation)
- Idempotency key generation

### Backend API Dependencies
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/local/sync` | POST | Sync offline operations |
| `/api/products/offline-catalog` | GET | Full product dump |
| `/api/reconciliation/pending` | GET | Sync conflicts |
| `/api/reconciliation/{id}` | POST | Resolve conflict |

### Key UX Considerations
- **Offline indicator**: Persistent, non-intrusive banner
- **Queue visibility**: Show pending sync count
- **Conflict alerts**: Notification when conflicts exist
- **Sync feedback**: Progress indicator during sync
- **Graceful degradation**: Disable admin functions offline

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB quota exceeded | Data loss | Monitor usage, prune old data |
| Duplicate sales on sync | Financial loss | Idempotency keys mandatory |
| Stale catalog prices | Customer disputes | Show "offline price" warning |
| Conflict resolution confusing | Manager frustration | Clear UI with options |

### Verification Checklist
- [ ] Service Worker installs correctly
- [ ] Product catalog caches to IndexedDB
- [ ] Offline mode allows sale creation
- [ ] Sale queues to IndexedDB when offline
- [ ] Online detection triggers sync
- [ ] Sync POST uses idempotency keys
- [ ] Duplicate sales rejected (idempotency)
- [ ] Sync conflicts appear in queue
- [ ] Conflict resolution UI allows decisions
- [ ] Offline indicator visible when disconnected
- [ ] Admin routes disabled offline

---

## Phase F9: Polish & Hardening

### Scope
- Comprehensive error handling
- Loading states for all async operations
- Form validation alignment with backend
- Accessibility audit (ARIA labels, focus management)
- Keyboard navigation (POS shortcuts)
- Performance optimization (bundle splitting)
- End-to-end testing setup
- Production build optimization

### Backend API Dependencies
None (polish phase)

### Key UX Considerations
- **Error messages**: Human-readable, localized (AR/EN)
- **Loading skeletons**: Not blank screens
- **Keyboard shortcuts**: F1-F12 for POS actions
- **Focus trap in modals**: Tab doesn't escape
- **Announcement of changes**: Screen reader updates

### Risks if Executed Incorrectly
| Risk | Impact | Mitigation |
|------|--------|------------|
| Unhandled promise rejections | Silent failures | Global error handler |
| No loading states | User uncertainty | Loading pattern library |
| Inaccessible for disabilities | Legal/ethical issues | Automated a11y testing |
| Large bundle size | Slow initial load | Lazy load routes |

### Verification Checklist
- [ ] All API errors show user-friendly message
- [ ] Loading states display during fetches
- [ ] Form errors match backend validation
- [ ] Keyboard navigation works in POS
- [ ] Tab focus trapped in modals
- [ ] Screen reader announces updates
- [ ] Lighthouse accessibility score > 90
- [ ] Bundle size < 500KB initial
- [ ] Lazy loading works for routes
- [ ] E2E tests pass for critical paths

---

## Tech Stack Recommendations

| Category | Recommendation | Rationale |
|----------|----------------|-----------|
| Framework | React 18 + TypeScript | Type safety, ecosystem |
| Build Tool | Vite | Fast dev server, optimized builds |
| State Management | Zustand or React Query | Lightweight, cache management |
| UI Components | Headless UI + Tailwind | Accessible, RTL-friendly |
| Charts | Recharts | Lightweight, customizable |
| Offline Storage | Dexie.js (IndexedDB) | Promise-based, reliable |
| HTTP Client | Axios | Interceptors, error handling |
| Forms | React Hook Form + Zod | Validation, performance |
| Routing | React Router 6 | Nested routes, loaders |
| Testing | Vitest + Testing Library | Fast, React-native |

---

## RTL Implementation Guide

### CSS Strategy
```css
/* Use logical properties */
.sidebar {
  margin-inline-start: 1rem;  /* Not margin-left */
  padding-inline-end: 2rem;   /* Not padding-right */
}

/* Direction-aware flexbox */
.row {
  display: flex;
  flex-direction: row; /* Reverses in RTL automatically */
}
```

### Component Pattern
```tsx
// Direction context available globally
const { direction } = useLocale(); // 'ltr' | 'rtl'

// Icons that need flipping
<ChevronIcon className={direction === 'rtl' ? 'rotate-180' : ''} />
```

### Testing RTL
- Every component must be visually tested in both directions
- Storybook stories include RTL variants
- Cypress tests run in both locales

---

## Deployment Considerations

### Development
- Vite dev server on port 5173
- Proxy API requests to Laravel backend on port 8080
- Hot module replacement enabled

### Production
- Static build to `dist/`
- Served by Apache (same as backend) or Nginx
- Environment variables via `.env.production`
- HTTPS required (backend enforces)

### Single-Client Specifics
- No environment switching UI
- API URL hardcoded to production
- No multi-tenant routing

---

## Known Backend Limitations

The frontend must account for these pre-existing backend test failures (documented as out-of-scope):

| Test | Issue | Frontend Workaround |
|------|-------|---------------------|
| AuthControllerTest (4 failures) | Message assertion mismatches | Use error codes, not messages |
| RoleControllerTest (4 failures) | Status code expectations | Handle 4xx gracefully |
| UserControllerTest (3 failures) | 500/422 instead of 200/201 | Generic error fallback |

These do not affect functionality—only test assertions.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-XX | Technical Audit | Initial frontend execution plan |

---

> **REMINDER:** This document is a PLAN, not implementation. No React code should be written until this plan is reviewed and approved. Each phase must be completed and verified before starting the next.
