# Frontend Execution Strategy

> **Document Version:** 1.0  
> **Related Document:** [frontend_execution_plan.md](frontend_execution_plan.md)  
> **Purpose:** Define HOW frontend phases are executed, not WHAT they contain

---

## Approval Gate

> **⛔ NO FRONTEND PHASE IMPLEMENTATION MAY BEGIN UNTIL THIS STRATEGY IS APPROVED.**

This document must be reviewed and explicitly approved before:
- Any React project initialization
- Any component development
- Any API integration work
- Any UI design implementation

Approval requires acknowledgment of:
1. All strict execution rules
2. The phase execution template
3. The Frontend–Backend Contract
4. The consequences of parallel execution

---

## Strict Execution Rules

### Rule 1: One Phase at a Time

```
❌ FORBIDDEN: Starting F2 while F1 is incomplete
❌ FORBIDDEN: Working on F3 and F5 simultaneously
❌ FORBIDDEN: "Getting ahead" on future phases

✅ REQUIRED: Complete F1 → Verify F1 → Approve F1 → Start F2
```

Each phase must reach **VERIFIED COMPLETE** status before the next phase begins.

### Rule 2: No Parallel Frontend Phases

Even if developers are available, phases execute sequentially:

| Week | Developer A | Developer B | Status |
|------|------------|-------------|--------|
| 1 | F1 work | F1 work | ✅ Allowed |
| 2 | F1 verification | F1 verification | ✅ Allowed |
| 3 | F2 work | F2 work | ✅ Allowed |
| ~~4~~ | ~~F2 work~~ | ~~F3 work~~ | ❌ FORBIDDEN |

### Rule 3: No UI Implementation Before Phase Approval

The phase execution template (below) must be completed before any code is written:

1. Phase entry conditions verified
2. Backend API verification checklist passed
3. Scope boundaries documented
4. Success criteria defined

**Writing code before approval = immediate phase failure.**

### Rule 4: No Assumptions Beyond Documented APIs

```
❌ FORBIDDEN: "The backend probably supports X"
❌ FORBIDDEN: "We'll add this endpoint later"
❌ FORBIDDEN: "This worked in another project"

✅ REQUIRED: Use ONLY endpoints in openapi.yaml
✅ REQUIRED: Use ONLY documented request/response structures
✅ REQUIRED: Verify endpoint exists before coding
```

---

## Phase Execution Template

Every phase MUST follow this template. Copy and complete before starting any phase.

### Phase [FX]: [Name]

#### 1. Entry Conditions

| Condition | Verified |
|-----------|----------|
| Previous phase (F[X-1]) is VERIFIED COMPLETE | ☐ |
| This strategy document is approved | ☐ |
| Backend APIs for this phase are documented | ☐ |
| Developer has read phase scope in execution plan | ☐ |
| No open blockers from previous phases | ☐ |

**⛔ STOP if any condition is not verified.**

#### 2. Backend API Verification Checklist

For EACH endpoint this phase requires:

| Endpoint | Method | Tested Manually | Returns Expected Structure | Auth Works |
|----------|--------|-----------------|---------------------------|------------|
| `/api/...` | GET/POST | ☐ | ☐ | ☐ |
| `/api/...` | GET/POST | ☐ | ☐ | ☐ |

**⛔ STOP if any endpoint fails verification.**

#### 3. Frontend Scope Boundaries

| In Scope | Out of Scope |
|----------|--------------|
| (List specific features) | (List what NOT to build) |
| ... | ... |

**⛔ STOP if scope creep is detected.**

#### 4. RTL Verification Requirements

| Component/Page | LTR Tested | RTL Tested | Layout Correct |
|----------------|------------|------------|----------------|
| (Component name) | ☐ | ☐ | ☐ |
| ... | ☐ | ☐ | ☐ |

**⛔ STOP if any component fails RTL verification.**

#### 5. Offline Behavior Expectations

| Scenario | Expected Behavior | Verified |
|----------|-------------------|----------|
| Network disconnected | (Describe) | ☐ |
| Network reconnected | (Describe) | ☐ |
| Cached data used | (Describe) | ☐ |

For phases F1–F7: Document graceful degradation only.  
For phase F8: Full offline functionality required.

#### 6. Error-Handling Expectations

| Error Scenario | Expected UI Behavior | Verified |
|----------------|---------------------|----------|
| 401 Unauthorized | Redirect to login | ☐ |
| 403 Forbidden | Show permission error | ☐ |
| 404 Not Found | Show "not found" message | ☐ |
| 422 Validation Error | Show field-level errors | ☐ |
| 500 Server Error | Show generic error, log details | ☐ |
| Network Timeout | Show retry option | ☐ |

**⛔ STOP if error handling is incomplete.**

#### 7. Measurable Success Criteria

| Criterion | Target | Actual | Pass |
|-----------|--------|--------|------|
| All verification checklist items pass | 100% | ___% | ☐ |
| All API integrations work | 100% | ___% | ☐ |
| RTL layout correct | 100% | ___% | ☐ |
| Error states handled | 100% | ___% | ☐ |
| No console errors | 0 | ___ | ☐ |
| Lighthouse accessibility score | >90 | ___ | ☐ |

**⛔ STOP if any criterion fails.**

#### 8. Explicit STOP Conditions

Phase execution MUST STOP immediately if:

- [ ] Any backend API returns unexpected structure
- [ ] Any backend API is missing or undocumented
- [ ] RTL layout breaks in any component
- [ ] Error handling is incomplete
- [ ] Success criteria target is not met
- [ ] Scope creep is detected
- [ ] Assumptions are made about backend behavior

**When STOP is triggered:**
1. Document the failure
2. Do NOT continue implementation
3. Do NOT attempt to fix backend
4. Escalate for resolution
5. Resume only after blocker is resolved

---

## Why Parallel Frontend Phases Cause Failure

### Problem 1: Hidden Dependency Chains

```
F1: Foundation
 └─► F2: Product Catalog (depends on F1 auth, layout)
      └─► F3: POS Core (depends on F2 product components)
           └─► F4: Payments (depends on F3 cart state)
```

If F1's layout has a bug, it propagates to F2, F3, F4. Fixing it later requires rework across ALL phases.

**Parallel execution multiplies rework cost.**

### Problem 2: Integration Point Accumulation

| Execution Style | Integration Points to Test |
|-----------------|---------------------------|
| Sequential | F1 → test → F2 → test → F3 → test |
| Parallel | F1+F2+F3 → test ALL at once |

Parallel execution delays integration testing, causing:
- Larger bug surface
- Harder root cause analysis
- Longer debugging cycles

### Problem 3: State Management Conflicts

Each phase adds to application state:
- F1: Auth state, locale state
- F2: Product cache
- F3: Cart state, held carts
- F4: Payment flow state

Building these in parallel creates:
- Conflicting state structures
- Incompatible data flows
- Merge conflicts in shared files

**Sequential execution ensures state architecture evolves correctly.**

### Problem 4: Resource Fragmentation

Parallel phases split developer focus:
- Incomplete phase A
- Incomplete phase B
- No phase fully tested
- No phase production-ready

**Sequential execution ensures each phase reaches production quality.**

### Problem 5: Rollback Complexity

If parallel phases fail:
- Which phase caused the failure?
- Which changes to revert?
- Which parts are safe to keep?

**Sequential execution makes rollback simple: revert the current phase only.**

---

## Frontend–Backend Contract

### Principle 1: Backend is Source of Truth

```
❌ WRONG: Frontend calculates tax differently than backend
❌ WRONG: Frontend has its own validation rules
❌ WRONG: Frontend assumes backend behavior

✅ RIGHT: Frontend displays what backend returns
✅ RIGHT: Frontend sends what backend expects
✅ RIGHT: Frontend validates THEN backend validates
```

All business logic lives in the backend. Frontend is a presentation layer.

### Principle 2: No Duplicated Business Logic

| Logic Type | Backend | Frontend |
|------------|---------|----------|
| Tax calculation | ✅ Calculates | ❌ Displays only |
| Inventory rules | ✅ Enforces | ❌ Shows errors |
| Payment validation | ✅ Validates | ❌ Mirrors validation |
| Price calculation | ✅ Calculates | ❌ Displays only |
| Permission checks | ✅ Enforces | ✅ Hides UI (supplemental) |

**Exception:** Frontend may perform **client-side validation** that mirrors backend rules for UX purposes, but backend validation is authoritative.

### Principle 3: Any Mismatch = Phase Failure

| Scenario | Result |
|----------|--------|
| Frontend expects field X, backend returns Y | **PHASE FAILURE** |
| Frontend sends format A, backend expects B | **PHASE FAILURE** |
| Frontend assumes endpoint exists, it doesn't | **PHASE FAILURE** |
| Frontend calculates total, doesn't match backend | **PHASE FAILURE** |

**Resolution process:**
1. Document the mismatch
2. Verify frontend is using documented API correctly
3. If frontend is correct: escalate as potential backend issue
4. If frontend is wrong: fix frontend implementation
5. Re-verify before continuing

### Contract Verification Checklist

Before any phase is marked complete:

| Verification | Passed |
|--------------|--------|
| All API calls use documented endpoints | ☐ |
| All request payloads match OpenAPI spec | ☐ |
| All response handling matches OpenAPI spec | ☐ |
| No business logic duplicated from backend | ☐ |
| Error responses handled per documentation | ☐ |
| Localized strings come from backend where applicable | ☐ |
| Currency values formatted from backend integers | ☐ |

---

## Phase Completion Checklist

A phase is VERIFIED COMPLETE only when:

| Requirement | Status |
|-------------|--------|
| All entry conditions were met | ☐ |
| All backend APIs verified working | ☐ |
| All scope items implemented | ☐ |
| No out-of-scope items implemented | ☐ |
| All RTL tests pass | ☐ |
| All error scenarios handled | ☐ |
| All success criteria met | ☐ |
| No STOP conditions triggered | ☐ |
| Frontend–Backend contract verified | ☐ |
| Phase reviewed and approved | ☐ |

**Only after ALL items are checked may the next phase begin.**

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-18 | Technical Audit | Initial execution strategy |

---

> **FINAL REMINDER:** This strategy governs HOW phases execute. The [Frontend Execution Plan](frontend_execution_plan.md) defines WHAT each phase contains. Both documents must be approved before implementation begins.
