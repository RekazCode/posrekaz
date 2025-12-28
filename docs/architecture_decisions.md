# Architecture Decisions Summary (LOCKED)

> [!IMPORTANT]
> This document contains finalized architecture decisions. Review and approve before Phase 1 implementation.

---

## 1. Authentication Strategy ✅ DECIDED

### Decision: **Laravel Sanctum (SPA Token Mode)**

| Option | Local POS | Web Deploy | Offline PWA | Verdict |
|--------|-----------|------------|-------------|---------|
| **Sanctum** | ✅ Simple | ✅ Stateless | ✅ Token cached | **CHOSEN** |
| Passport | ❌ Overkill | ✅ OAuth2 | ⚠️ Complex | No |
| tymon/jwt | ⚠️ Extra pkg | ✅ True JWT | ✅ Works | Backup |

### Rationale
- **Sanctum SPA tokens** are stateless (no session), work like JWT
- Simpler than Passport, no OAuth2 complexity needed
- Token stored in IndexedDB for offline auth validation
- Refresh token flow handles expiry gracefully

### Implementation Rules
- Access token TTL: **60 minutes**
- Refresh token TTL: **14 days**
- Offline: validate cached token signature locally, queue requests
- On reconnect: refresh token, replay queue

---

## 2. Offline POS Policy ✅ DECIDED

### Scope: **Sales-Only Offline**

| Operation | Offline? | Reason |
|-----------|----------|--------|
| Create Sale | ✅ Yes | Core POS function |
| View Products | ✅ Yes | Cached catalog |
| Stock Levels | ⚠️ Read-only | Last-known from cache |
| Adjust Stock | ❌ No | Requires reconciliation |
| Create Product | ❌ No | Admin function |

### Conflict Resolution Strategy

**Approach: Optimistic + Manual Reconciliation**

```
┌─────────────────────────────────────────────────────────┐
│                    OFFLINE SALE FLOW                    │
├─────────────────────────────────────────────────────────┤
│ 1. Generate client UUID + idempotency_key               │
│ 2. Decrement local cache stock (optimistic)             │
│ 3. Queue sale in IndexedDB                              │
│ 4. On reconnect: POST /api/local/sync                   │
│ 5. Server checks idempotency_key (skip duplicates)      │
│ 6. Server validates stock → SUCCESS or CONFLICT         │
└─────────────────────────────────────────────────────────┘
```

### Conflict Rules
| Scenario | Resolution |
|----------|------------|
| Duplicate idempotency_key | Skip (already processed) |
| Sufficient stock | Process normally |
| Insufficient stock (oversold) | **Flag for review**, allow sale (negative stock) |
| Price changed since offline | Use **offline price** (honor customer) |

### Two Devices Sell Last Unit
1. Both sales succeed (stock goes -1)
2. System flags "negative stock" alert
3. Manager reviews in **Reconciliation UI**
4. Options: accept oversell, adjust, or void one sale

---

## 3. Accounting Boundaries ✅ DECIDED

### Scope: **Operational Accounting Only**

| Included | Excluded |
|----------|----------|
| Cash register totals | General ledger |
| Sales tax tracking | Journal entries |
| Daily cash closes | Balance sheets |
| Payment reconciliation | P&L statements |
| Returns/refunds | Multi-company |

### Export Strategy
- **CSV/Excel export** for all financial data
- Structured format compatible with QuickBooks, Xero, local systems
- No native accounting integrations in MVP

### Phase 5 Update
- Remove "general ledger entries" from scope
- Add "Export to Accounting" as structured CSV

---

## 4. Hardware Integration ✅ DECIDED

### MVP Default: **Web Standard (Tier 1)**

| Tier | Hardware | MVP? | Implementation |
|------|----------|------|----------------|
| **Tier 1** | Keyboard barcode scanner | ✅ Yes | Input field focus |
| **Tier 1** | PDF receipt printing | ✅ Yes | Browser print API |
| **Tier 2** | ESC/POS thermal printer | Phase 5 | Electron bridge |
| **Tier 2** | Cash drawer | Phase 5 | Serial via bridge |

### Fallback Path
1. **Primary:** Web standards (always works)
2. **Enhanced:** Detect Electron bridge at runtime
3. **Graceful:** If bridge unavailable, fall back to PDF

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| ESC/POS printer varies by vendor | Abstract encoder, test top 3 brands |
| WebUSB browser support limited | Electron bridge as primary path |
| Cash drawer requires serial | Bridge only, no web fallback |

---

## 5. Deployment Modes ✅ DECIDED

### Local Mode
```env
APP_ENV=local
APP_URL=http://localhost:8080
DB_CONNECTION=mysql
DB_DATABASE=pos_local
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```
- Apache on **port 8080**
- **MySQL** (via XAMPP) - SQLite removed for consistency
- Single-device or LAN multi-device
- Offline queue enabled

### Web Mode
```env
APP_ENV=production
APP_URL=https://pos.yourdomain.com
DB_CONNECTION=mysql
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```
- HTTPS required
- MySQL + Redis
- Multi-device, multi-location
- Centralized sync

### Behavioral Differences
| Feature | Local | Web |
|---------|-------|-----|
| Database | MySQL (XAMPP) | MySQL (Cloud) |
| Cache | File | Redis |
| Queue | Sync | Redis |
| Auth | Same | Same |
| Offline | Enabled | Enabled |

---

## 6. Risk Register

### Top 5 Technical Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | **Offline sync data loss** | Medium | High | Idempotency keys, local backup, conflict UI |
| 2 | **Stock oversell conflicts** | Medium | Medium | Allow negative, flag for review, reconcile |
| 3 | **ESC/POS printer compatibility** | High | Medium | Test top 3 brands, PDF fallback |
| 4 | **PWA cache invalidation** | Medium | Medium | Version-based cache busting |
| 5 | **Arabic RTL layout bugs** | Medium | Low | Early RTL testing, CSS logical properties |

### Assumptions
1. Single currency (LYD) - no multi-currency
2. Single timezone per installation
3. Internet available at least once daily for sync
4. Modern browsers (Chrome 90+, Edge, Safari 15+)
5. Barcode scanners emit keyboard events (HID mode)

---

## 7. Ready to Implement Checklist

### Architecture Locked ✅
- [x] Authentication: Sanctum SPA tokens
- [x] Offline scope: Sales-only with optimistic sync
- [x] Conflict resolution: Flag + manual reconciliation
- [x] Accounting: Operational only, CSV export
- [x] Hardware MVP: Web standards, bridge later
- [x] Local mode: MySQL on port 8080

### Scope Boundaries Defined ✅
- [x] No general ledger / full accounting
- [x] No multi-currency
- [x] No native mobile app
- [x] No real-time stock sync (eventual consistency)

### Risks Acknowledged ✅
- [x] Offline sync risks documented
- [x] Hardware compatibility risks documented
- [x] Mitigation strategies defined

---

## Phase Updates Summary

| Phase | Key Change |
|-------|------------|
| Phase 1 | Auth = Sanctum SPA tokens (not "JWT") |
| Phase 3 | Added explicit offline-sync policy |
| Phase 5 | Accounting = operational only, CSV export |
| Phase 5 | Hardware = Tier 1 MVP, Tier 2 deferred |

> [!CAUTION]
> Await approval before starting Phase 1 implementation.
