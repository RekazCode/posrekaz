# Frontend UI Improvement Plan

**Author:** Claude (AI Product & UI/UX Architect)  
**Date:** December 21, 2025  
**Version:** 1.0.0

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Design Principles & Visual Language](#2-design-principles--visual-language)
3. [Touch-First / POS Constraints](#3-touch-first--pos-constraints)
4. [RTL & Localization Rules](#4-rtl--localization-rules)
5. [Component Library & Design System](#5-component-library--design-system)
6. [Layout & Templates](#6-layout--templates)
7. [Visual QA & Overlap Checks](#7-visual-qa--overlap-checks)
8. [Accessibility (A11y)](#8-accessibility-a11y)
9. [Performance & Perceived Performance](#9-performance--perceived-performance)
10. [Printing & Hardware Integration UX](#10-printing--hardware-integration-ux)
11. [Testing Plan](#11-testing-plan)
12. [Phased Implementation Roadmap](#12-phased-implementation-roadmap)
13. [Deliverables & Artefacts](#13-deliverables--artefacts)
14. [Rollout Strategy & Monitoring](#14-rollout-strategy--monitoring)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

This plan transforms the existing POS web frontend into a **modern, touch-first, accessible, RTL-native interface** optimized for point-of-sale touchscreens, kiosks, and cashier displays. The scope encompasses refining the existing component library (Button, NumPad, DataTable, ProductCard, CartPanel, Modal, etc.), establishing robust design tokens, enforcing minimum 48px tap targets, implementing CSS logical properties for seamless Arabic RTL support, and creating comprehensive visual regression and accessibility test suites. Expected outcomes include: zero element overlap on POS resolutions, WCAG 2.1 AA compliance, sub-3-second perceived POS transaction flows, and a maintainable Storybook-driven component library. All backend APIs remain unchanged.

---

## 2. Design Principles & Visual Language

### 2.1 Aesthetic Direction

**Style:** Modern flat design with subtle depth cues—soft shadows, rounded corners (8–16px radii), high-contrast text for outdoor/bright retail environments.

**Key characteristics:**
- Clean, uncluttered layouts with generous whitespace
- Card-based UI for scannable content hierarchy
- Micro-interactions: subtle scale on tap (0.96–0.98), smooth 150–200ms transitions
- Dark mode support for low-light POS environments

### 2.2 Design Tokens

#### Color Palette

| Token | Light Mode | Dark Mode | Semantic Use |
|-------|-----------|-----------|--------------|
| `--color-primary-50` | `#eff6ff` | – | Hover backgrounds |
| `--color-primary-100` | `#dbeafe` | – | Active backgrounds |
| `--color-primary-500` | `#3b82f6` | `#3b82f6` | Primary buttons, links |
| `--color-primary-600` | `#2563eb` | `#60a5fa` | Primary button default |
| `--color-primary-700` | `#1d4ed8` | – | Primary button hover |
| `--color-secondary` | `#71717a` | `#a1a1aa` | Secondary text, icons |
| `--color-success` | `#22c55e` | `#22c55e` | Success states, confirmations |
| `--color-warning` | `#f59e0b` | `#f59e0b` | Low stock, warnings |
| `--color-error` | `#ef4444` | `#ef4444` | Errors, destructive actions |
| `--color-bg-base` | `#ffffff` | `#09090b` | Page/card backgrounds |
| `--color-bg-subtle` | `#fafafa` | `#18181b` | Subtle backgrounds |
| `--color-bg-muted` | `#f4f4f5` | `#27272a` | Muted/disabled backgrounds |
| `--color-border-default` | `#d4d4d8` | `#3f3f46` | Default borders |
| `--color-text-primary` | `#18181b` | `#f4f4f5` | Primary text |
| `--color-text-secondary` | `#71717a` | `#a1a1aa` | Secondary text |

#### Additional Semantic Tokens

```css
:root {
  /* Transaction States */
  --color-sale-pending: #f59e0b;
  --color-sale-completed: #22c55e;
  --color-sale-refunded: #8b5cf6;
  
  /* Stock Levels */
  --color-stock-out: #ef4444;
  --color-stock-low: #f59e0b;
  --color-stock-ok: #22c55e;
  
  /* Offline/Sync States */
  --color-offline: #f59e0b;
  --color-syncing: #3b82f6;
  --color-synced: #22c55e;
}
```

### 2.3 Typography

| Element | Font Family | Size (Desktop) | Size (POS/Tablet) | Weight | Line Height |
|---------|-------------|----------------|-------------------|--------|-------------|
| Body | Geist Sans / Noto Sans Arabic | 16px | 18px | 400 | 1.5 |
| H1 | Geist Sans | 32px | 28px | 700 | 1.2 |
| H2 | Geist Sans | 24px | 22px | 600 | 1.3 |
| H3 | Geist Sans | 20px | 18px | 600 | 1.4 |
| Price (Large) | Geist Sans | 28px | 32px | 700 | 1.1 |
| Price (Item) | Geist Sans | 18px | 20px | 600 | 1.2 |
| Caption | Geist Sans | 12px | 14px | 400 | 1.4 |
| Button | Geist Sans | 16px | 18px | 500 | 1 |
| Keypad | Geist Mono | 24px | 28px | 600 | 1 |

**Arabic typography:** Use `Noto Sans Arabic` as primary, with fallback to system Arabic fonts. Ensure font-feature-settings for proper Arabic ligatures.

### 2.4 Iconography

- **Style:** Lucide React icons (outline style, 1.5px stroke)
- **Sizes:**
  - Small (inline): 16px
  - Default: 20px
  - Touch actions: 24px
  - Hero/empty states: 48–64px
- **RTL behavior:** Icons that imply direction (arrows, chevrons) should flip. Use `.rtl-flip` class.

### 2.5 Spacing System

**Base unit:** 4px

| Token | Value | Use Case |
|-------|-------|----------|
| `--space-1` | 4px | Tight padding, icon gaps |
| `--space-2` | 8px | Internal component padding |
| `--space-3` | 12px | Card internal padding |
| `--space-4` | 16px | Standard gap between elements |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Large section gaps |
| `--space-8` | 32px | Page section margins |
| `--space-10` | 40px | Major layout divisions |
| `--space-12` | 48px | Touch-safe spacing |

### 2.6 Elevation/Shadow System

| Level | Shadow | Use Case |
|-------|--------|----------|
| 0 | none | Flat elements |
| 1 | `0 1px 2px rgba(0,0,0,0.05)` | Subtle cards, inputs |
| 2 | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards, buttons |
| 3 | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | Elevated cards, dropdowns |
| 4 | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` | Modals, overlays |
| 5 | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` | Tooltips, popovers |

---

## 3. Touch-First / POS Constraints

### 3.1 Tap Target Sizes

| Element Type | Minimum Size | Recommended Size | Notes |
|--------------|--------------|------------------|-------|
| Secondary actions | 44px | 48px | Icons, close buttons |
| Primary buttons | 48px | 56px | Add to cart, checkout |
| Keypad buttons | 56px | 64px | NumPad for payment |
| Product tiles | 140px × 160px | 160px × 180px | Grid items |
| Cart item row | 64px height | 72px height | Swipe-to-delete target |

### 3.2 Safe Zones

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    SAFE CONTENT ZONE                    │  │
│  │                                                         │  │
│  │   Minimum 16px from all edges for bezel/case overlap    │  │
│  │                                                         │  │
│  │   Bottom 80px reserved for:                             │  │
│  │   - Checkout button (always visible)                    │  │
│  │   - Cart summary bar                                    │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Cash Drawer / Scanner area - no interactive elements]     │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Recommended Layouts

#### Landscape POS (1920×1080, 1366×768)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Header: Search | Categories | Offline Status | User]        64px  │
├────────────────────────────────────────────┬────────────────────────┤
│                                            │                        │
│            PRODUCT GRID                    │      CART PANEL        │
│         (4-5 columns, scrollable)          │     (Fixed 400px)      │
│                                            │                        │
│         - Category filters                 │  - Items list          │
│         - Search results                   │  - Quantity controls   │
│         - Product cards (160px)            │  - Subtotal/Tax/Total  │
│                                            │  - Action buttons      │
│                                            │                        │
│                                            ├────────────────────────┤
│                                            │  [CHECKOUT BUTTON]     │
│                                            │      (72px height)     │
└────────────────────────────────────────────┴────────────────────────┘
```

#### Portrait Tablet (768×1024, 1024×1366)

```
┌───────────────────────────────────────┐
│  [Header]                       64px  │
├───────────────────────────────────────┤
│                                       │
│          PRODUCT GRID                 │
│       (2-3 columns, scrollable)       │
│                                       │
│       60% of viewport height          │
│                                       │
├───────────────────────────────────────┤
│                                       │
│          CART PANEL                   │
│      (Bottom sheet, expandable)       │
│                                       │
│  - Collapsed: Summary + Checkout      │
│  - Expanded: Full cart items          │
│                                       │
└───────────────────────────────────────┘
```

### 3.4 Large Numerics

- Prices and totals: Use `tabular-nums` font feature for aligned digits
- Currency formatting: LYD with 3 decimal places
- Font size for totals: 28–32px, bold
- High contrast: Ensure 7:1 ratio for price displays

### 3.5 Haptic/Visual Feedback

| Action | Visual Feedback | Timing |
|--------|-----------------|--------|
| Button tap | Scale to 0.96 | 100ms |
| Product add | Card pulse + slide animation | 200ms |
| Cart update | Item highlight flash | 300ms |
| Successful action | Green checkmark toast | 2000ms |
| Error | Red shake animation | 400ms |
| Loading | Skeleton or spinner | Immediate |

---

## 4. RTL & Localization Rules

### 4.1 CSS Logical Properties Strategy

**Mandatory:** Replace all physical properties with logical equivalents.

| Physical Property | Logical Equivalent |
|-------------------|-------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `float: left` | `float: inline-start` |

### 4.2 Layout Mirroring

```css
/* Automatic RTL support */
html[dir="rtl"] {
  /* Layout automatically mirrors with logical properties */
}

/* Icons that need flipping */
.rtl-flip {
  transform: scaleX(1);
}

html[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}

/* Icons that should NOT flip */
.rtl-preserve {
  /* Checkmarks, plus signs, numbers - keep as-is */
}
```

**Icons to flip:** Arrows, chevrons, forward/back, logout, external link  
**Icons to preserve:** Checkmarks, X/close, plus/minus, currency symbols, numbers

### 4.3 Animation Mirroring

```css
/* Slide animations */
@keyframes slideInStart {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

html[dir="rtl"] .slide-in {
  animation: slideInEnd 200ms ease-out;
}

@keyframes slideInEnd {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

### 4.4 Localization Strategy

#### String Fallback

```typescript
// Priority: User locale → Default locale → Key
t('pos.checkout', 'Checkout') // Returns Arabic if locale=ar, else fallback
```

#### Number Formatting

```typescript
const formatCurrency = (amount: number, locale: 'ar' | 'en') => {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
    style: 'currency',
    currency: 'LYD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
};

// Output (ar): ١٢٣٫٤٥٦ د.ل
// Output (en): LYD 123.456
```

#### Pluralization

```typescript
// Use ICU MessageFormat for complex plurals
const messages = {
  'cart.items': {
    ar: '{count, plural, =0 {لا توجد منتجات} one {منتج واحد} two {منتجان} few {# منتجات} many {# منتجًا} other {# منتج}}',
    en: '{count, plural, =0 {No items} one {# item} other {# items}}'
  }
};
```

### 4.5 Date/Time Display

```typescript
const formatDateTime = (date: Date, locale: 'ar' | 'en') => {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
```

**Timezone:** Store all timestamps in UTC, display in Libya timezone (`Africa/Tripoli`, UTC+2).

---

## 5. Component Library & Design System

### 5.1 Core Components

#### Button

**Purpose:** Primary interactive element for all user actions.

| Prop | Values | Description |
|------|--------|-------------|
| `variant` | `primary`, `secondary`, `outline`, `ghost`, `destructive` | Visual style |
| `size` | `sm` (32px), `md` (48px), `lg` (56px), `touch` (64px full-width) | Height |
| `isLoading` | boolean | Shows spinner, disables |
| `leftIcon`, `rightIcon` | ReactNode | Icon placement |

**States:** Default, Hover, Active, Focused, Disabled, Loading

**Accessibility:**
- `role="button"` implicit
- `aria-disabled` when disabled
- `aria-busy` when loading
- Focus ring: 2px offset, primary color

**Keyboard:** Enter/Space activates

**RTL:** Icons auto-flip based on semantic meaning

**Touch:** Minimum 48px height, 200ms debounce for double-tap prevention

**Visual Spec:**
```css
.btn {
  min-height: var(--touch-target);
  padding-inline: var(--space-4);
  border-radius: 8px;
  font-weight: 500;
  transition: all 150ms ease;
}
```

---

#### NumericKeypad

**Purpose:** Touch-optimized numeric input for quantities and payments.

**Layout:** 4×3 grid + action buttons

```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
├─────┼─────┼─────┤
│  7  │  8  │  9  │
├─────┼─────┼─────┤
│  .  │  0  │ ⌫  │
├─────┴─────┼─────┤
│   CLEAR   │  ✓  │
└───────────┴─────┘
```

**States:** Each key has default, pressed (scale 0.95), disabled

**Accessibility:**
- `role="group"` with `aria-label="Numeric keypad"`
- Each key: `role="button"`, `aria-label` for special keys
- Announce value changes via live region

**Keyboard:** Number keys work, Enter for confirm, Escape for clear

**RTL:** Layout remains LTR (international numpad convention)

**Touch:** 64px × 64px minimum per key, 8px gap

**Visual Spec:**
```css
.keypad-key {
  min-height: 64px;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 600;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-default);
}
```

---

#### ProductTile

**Purpose:** Display product in grid for selection.

**Layout:**
```
┌────────────────────┐
│    [Image/Icon]    │  100px
│                    │
├────────────────────┤
│  Product Name      │  2 lines max
│  (line-clamp-2)    │
├────────────────────┤
│  LYD 12.500  [qty] │
└────────────────────┘
```

**States:** Default, Hover (border highlight), Selected, Out of Stock (grayscale + badge), Low Stock (warning badge)

**Accessibility:**
- `role="button"`
- `aria-label="{product name}, {price}, {stock status}"`
- `aria-disabled` when out of stock

**Keyboard:** Tab to focus, Enter to select

**RTL:** Text alignment start, price alignment end

**Touch:** Full tile is tap target (160px × 180px minimum)

**Visual Spec:**
```css
.product-tile {
  min-width: 160px;
  min-height: 180px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-subtle);
}

.product-tile:hover {
  border-color: var(--color-primary-400);
}
```

---

#### CartPanel

**Purpose:** Display current sale items with totals.

**Sections:**
1. Header (title, item count badge, action buttons)
2. Customer indicator (if attached)
3. Scrollable items list
4. Discount input
5. Totals summary
6. Checkout button (sticky)

**States:** Empty, Has Items, Has Held Sales indicator

**Accessibility:**
- `role="region"` with `aria-label="Shopping cart"`
- Live region for item count changes
- `aria-live="polite"` for total updates

**Keyboard:** Tab through items, Delete key removes focused item

**RTL:** Border on inline-end side, text flows correctly

**Touch:**
- Quantity buttons: 44px
- Swipe-to-delete on items
- Checkout button: 72px height

---

#### DataTable

**Purpose:** Display tabular data with sorting, pagination, selection.

**Features:**
- Responsive: Card view on mobile
- Sortable columns with clear indicators
- Row selection with checkboxes
- Inline actions menu
- Skeleton loading state

**Accessibility:**
- `role="table"` with proper structure
- `aria-sort` on sortable headers
- Row selection announced
- Pagination controls labeled

**RTL:** Column order preserved, alignment uses logical properties

**Touch:** Row height 64px, action buttons 44px

---

#### Modal/Drawer

**Purpose:** Overlay for focused interactions (checkout, forms).

**Variants:**
- `center`: Traditional centered modal
- `bottom`: Bottom sheet (mobile/tablet preferred)
- `drawer`: Side panel (desktop)

**Sizes:** `sm` (400px), `md` (500px), `lg` (600px), `xl` (800px), `full`

**Accessibility:**
- Focus trap enabled
- `role="dialog"` with `aria-modal="true"`
- `aria-labelledby` pointing to title
- Close on Escape
- Return focus on close

**RTL:** Drawer opens from inline-end

---

#### Toast/Notification

**Purpose:** Transient feedback messages.

**Variants:** `success`, `warning`, `error`, `info`

**Position:** Top-center (POS), or top-end (desktop)

**Duration:** 3000ms default, 5000ms for errors

**Accessibility:**
- `role="alert"` for errors
- `aria-live="polite"` for info/success
- Dismissible with close button

---

#### Badge

**Purpose:** Status indicators, counts.

**Variants:** `primary`, `secondary`, `success`, `warning`, `danger`, `neutral`

**Sizes:** `sm` (20px), `md` (24px), `lg` (28px)

---

#### ConfirmDialog

**Purpose:** Confirmation for destructive actions.

**Layout:**
- Icon (warning/danger)
- Title + description
- Cancel + Confirm buttons (destructive styling)

**Accessibility:**
- Focus on cancel button by default (safe option)
- `aria-describedby` for description

---

#### ReceiptPreview

**Purpose:** Display/print thermal receipt.

**Constraints:**
- 80mm width (302px at 96 DPI)
- Monospace font
- No color (black only)
- QR code for digital receipt (optional)

**Accessibility:**
- Print button clearly labeled
- Preview scrollable

---

#### Forms

**Input Variants:**
- Text input (48px height)
- Number input with stepper
- Currency input with formatting
- Select dropdown
- Textarea
- Checkbox/Radio (44px tap targets)
- Date picker
- Search input with clear button

**Validation States:** Default, Error, Success, Disabled

**Accessibility:**
- Labels always visible (no placeholder-only)
- Error messages with `aria-describedby`
- Required fields with `aria-required`

---

#### Skeleton

**Purpose:** Loading placeholders.

**Types:** Text lines, Cards, Table rows, Product grid

**Animation:** Shimmer effect (subtle pulse)

---

#### EmptyState

**Purpose:** Communicate no data state with action.

**Layout:**
- Large icon (48–64px)
- Title
- Description
- Optional CTA button

---

### 5.2 Component Deliverables

For each component:
1. **Storybook story** with all variants/states
2. **Figma component** with auto-layout and variants
3. **CSS token integration** (Tailwind config or CSS variables)
4. **Accessibility annotation** in Figma
5. **Usage documentation** in MDX

---

## 6. Layout & Templates

### 6.1 Breakpoints

| Name | Min Width | Target Devices |
|------|-----------|----------------|
| `mobile` | 0 | Phones (rare for POS) |
| `tablet` | 768px | Portrait tablets |
| `desktop` | 1024px | Landscape tablets, small POS |
| `pos` | 1280px | Standard POS displays |
| `wide` | 1536px | Large POS, dual displays |

### 6.2 Grid System

**Columns:** 12-column grid

**Gutters:**
- Mobile: 16px
- Tablet: 20px
- Desktop/POS: 24px

**Container max-widths:**
- `tablet`: 720px
- `desktop`: 960px
- `pos`: 1200px
- `wide`: 1400px

### 6.3 Layout Templates

#### AppShell

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Sidebar 272px]  │  [Header 64px]                                    │
│                  ├───────────────────────────────────────────────────┤
│  Navigation      │                                                   │
│  - POS           │              MAIN CONTENT AREA                    │
│  - Products      │                                                   │
│  - Inventory     │         (scrollable, padded 24px)                 │
│  - Reports       │                                                   │
│  - Settings      │                                                   │
│                  │                                                   │
│ [User Info]      │                                                   │
└──────────────────┴───────────────────────────────────────────────────┘
```

#### POS Layout

Optimized for minimal navigation, maximum product display.

```
Desktop/POS Landscape:
┌────────────────────────────────────────────────────────────────────────┐
│ Search [_________________________] │ Categories │ Offline │ User  64px │
├────────────────────────────────────┬───────────────────────────────────┤
│                                    │                                   │
│        PRODUCT GRID                │          CART PANEL               │
│     (scrollable, 3-5 columns)      │       (fixed 380-420px)           │
│                                    │                                   │
│                                    │  ┌─────────────────────────────┐  │
│                                    │  │ Customer: [Name]     [X]   │  │
│                                    │  ├─────────────────────────────┤  │
│                                    │  │ Item 1           LYD 12.50 │  │
│                                    │  │ Item 2           LYD  8.00 │  │
│                                    │  ├─────────────────────────────┤  │
│                                    │  │ Subtotal         LYD 20.50 │  │
│                                    │  │ Tax              LYD  0.00 │  │
│                                    │  │ TOTAL            LYD 20.50 │  │
│                                    │  ├─────────────────────────────┤  │
│                                    │  │    [  CHECKOUT  ]   72px   │  │
│                                    │  └─────────────────────────────┘  │
└────────────────────────────────────┴───────────────────────────────────┘
```

#### Product CRUD Page

```
┌────────────────────────────────────────────────────────────────────────┐
│ [← Back]  Products / [Create|Edit] Product                     Header │
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐  ┌──────────────────────────────────────┐ │
│ │                          │  │  Basic Information                   │ │
│ │    Product Image         │  │  ─────────────────                   │ │
│ │    Upload/Preview        │  │  Name:    [___________________]      │ │
│ │                          │  │  SKU:     [___________________]      │ │
│ │                          │  │  Barcode: [___________________]      │ │
│ └──────────────────────────┘  │  Category: [Select ▼]                │ │
│                               │                                      │ │
│                               │  Pricing                             │ │
│                               │  ─────────────────                   │ │
│                               │  Cost:  [LYD ______]                 │ │
│                               │  Sale:  [LYD ______]                 │ │
│                               └──────────────────────────────────────┘ │
│                                                                        │
│                               [Cancel]  [Save Product]          Footer │
└────────────────────────────────────────────────────────────────────────┘
```

#### Reports Page

```
┌────────────────────────────────────────────────────────────────────────┐
│ Reports                    [Date Range Picker]  [Export ▼]     Header │
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │  Sales Chart (Line/Bar)                                          │   │
│ │                                                                  │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────┐   │
│ │ Total Sales   │ │ Transactions  │ │ Avg Order     │ │ Top Product│   │
│ │ LYD 12,500.00 │ │     127       │ │ LYD 98.50     │ │ Widget A   │   │
│ └───────────────┘ └───────────────┘ └───────────────┘ └────────────┘   │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │  Sales Table (DataTable)                                         │   │
│ │                                                                  │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Checkout Flow (Modal)

```
Step 1: Review → Step 2: Payment → Step 3: Complete

┌────────────────────────────────────────────────────────────────┐
│ Checkout                                                [X]    │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────┐  ┌────────────────────────────────┐ │
│ │  Order Summary         │  │  Payment                       │ │
│ │  ──────────────        │  │  ──────────────                │ │
│ │  3 items               │  │  Total: LYD 125.500            │ │
│ │  Subtotal: LYD 120.00  │  │                                │ │
│ │  Tax:      LYD   5.50  │  │  [Cash] [Card] [Mobile]       │ │
│ │  ─────────────────     │  │                                │ │
│ │  TOTAL:   LYD 125.50   │  │  Amount: [_______________]     │ │
│ │                        │  │                                │ │
│ │                        │  │  ┌─────────────────────────┐   │ │
│ │                        │  │  │     NUMERIC KEYPAD      │   │ │
│ │                        │  │  │                         │   │ │
│ │                        │  │  └─────────────────────────┘   │ │
│ └────────────────────────┘  └────────────────────────────────┘ │
│                                                                │
│                [Cancel]              [Complete Sale]           │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Visual QA & Overlap Checks

### 7.1 Automated Visual Regression Strategy

**Tools:** Playwright + Percy/Chromatic

**Snapshot List:**

| Page/Component | Variants to Capture |
|----------------|---------------------|
| POS Page | Empty cart, with items, offline mode |
| Product Grid | Loading, with products, filtered, empty |
| Cart Panel | Empty, 1 item, multiple items, with customer |
| Checkout Modal | Step 1, Step 2 (each payment method), Success |
| Receipt Preview | Short receipt, long receipt |
| Product Form | Create (empty), Edit (populated), Validation errors |
| DataTable | Loading, with data, empty, with selection |
| Modal | Each size, RTL variant |
| NumericKeypad | Default, with input |
| Login Page | Default, error state |
| Dashboard | With data, loading |

**Capture at breakpoints:** 768px, 1024px, 1366px, 1920px

**RTL:** Capture all above in both LTR and RTL

### 7.2 Overlap Detection Tests

```typescript
// Playwright test for element overlap detection
async function checkNoOverlap(page: Page, selectors: string[]) {
  const rects = await Promise.all(
    selectors.map(async (s) => {
      const el = await page.$(s);
      return el ? await el.boundingBox() : null;
    })
  );
  
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rects[i] && rects[j]) {
        const overlap = rectsOverlap(rects[i], rects[j]);
        expect(overlap).toBeFalsy();
      }
    }
  }
}

// Check z-index conflicts
async function checkZIndexHierarchy(page: Page) {
  const modals = await page.$$('[role="dialog"]');
  const overlays = await page.$$('.overlay');
  // Verify modals are above overlays
}
```

**Critical overlap checks:**
- Cart panel vs product grid
- Checkout button vs cart items scroll
- Modal vs backdrop
- Header vs page content
- Sidebar vs main content on mobile

### 7.3 Manual QA Checklist

| Device | Resolution | OS | Browser | Status |
|--------|------------|----|---------|----|
| iPad Pro 12.9" | 1024×1366 | iPadOS 17 | Safari | ☐ |
| iPad 10th gen | 820×1180 | iPadOS 17 | Safari | ☐ |
| Android Tablet | 800×1280 | Android 13 | Chrome | ☐ |
| POS Terminal (Sunmi) | 1920×1080 | Android 11 | Chrome | ☐ |
| Windows Kiosk | 1366×768 | Windows 11 | Edge | ☐ |
| Desktop | 1920×1080 | Windows 11 | Chrome | ☐ |
| Desktop RTL | 1920×1080 | Windows 11 | Chrome | ☐ |

**Manual Test Scenarios:**
1. Complete a 5-item sale with cash payment
2. Complete a sale with split payment (cash + card)
3. Hold a sale, start new sale, recall held sale
4. Process sale while offline, verify sync on reconnect
5. Print receipt on 80mm thermal printer
6. Navigate entire app using only touch
7. Navigate entire app using only keyboard

---

## 8. Accessibility (A11y)

### 8.1 WCAG 2.1 AA Targets

| Criterion | Target | Current Status | Notes |
|-----------|--------|----------------|-------|
| 1.4.3 Contrast (Minimum) | 4.5:1 text, 3:1 UI | Audit needed | Large text: 3:1 |
| 1.4.11 Non-text Contrast | 3:1 | Audit needed | Buttons, inputs |
| 2.1.1 Keyboard | Full operation | Partial | Modal traps needed |
| 2.4.3 Focus Order | Logical | Audit needed | |
| 2.4.7 Focus Visible | 2px ring | Implemented | |
| 4.1.2 Name, Role, Value | ARIA labels | Partial | NumPad needs work |

### 8.2 Screen Reader Flows

**POS Sale Flow:**
1. Announce page: "Point of Sale. Cart is empty."
2. Product selection: "Added [Product Name] to cart. Cart now has [X] items. Total [Amount]."
3. Quantity change: "[Product Name] quantity updated to [X]."
4. Checkout: "Checkout. Total amount [X]. Select payment method."
5. Payment: "Payment of [Amount] added. Remaining balance [X]."
6. Complete: "Sale completed. Transaction [ID]. Printing receipt."

### 8.3 ARIA Implementation

**Live Regions:**
```tsx
// Cart totals
<div aria-live="polite" aria-atomic="true" className="sr-only">
  Cart total: {formatCurrency(total)}
</div>

// Offline indicator
<div role="status" aria-live="assertive">
  {isOffline ? t('status.offline', 'Working offline') : ''}
</div>
```

**Modal Focus Trap:**
```tsx
// Already implemented in Modal.tsx via useFocusTrap
// Ensure all modals use this pattern
```

**Keypad:**
```tsx
<div role="group" aria-label={t('keypad.label', 'Numeric keypad')}>
  <button aria-label="1">1</button>
  <button aria-label={t('keypad.backspace', 'Backspace')}>⌫</button>
  <button aria-label={t('keypad.clear', 'Clear')}>C</button>
</div>
```

---

## 9. Performance & Perceived Performance

### 9.1 Critical Rendering Path

**Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s

**Strategies:**
1. **Code splitting:** Already implemented (vendor chunks)
2. **Preload critical fonts:** Geist Sans, Noto Sans Arabic
3. **Inline critical CSS:** Above-fold styles
4. **Service Worker:** Cache shell for offline

### 9.2 Product Catalog Optimization

```typescript
// Preload first page of products on POS mount
useEffect(() => {
  prefetchProducts({ page: 1, limit: 50 });
}, []);

// Virtual scrolling for large grids
import { VirtualGrid } from 'react-window';
```

### 9.3 Image Strategy

| Image Type | Max Size | Format | Loading |
|------------|----------|--------|---------|
| Product thumbnail | 200×200 | WebP, JPEG fallback | Lazy |
| Product grid | 400×400 | WebP, JPEG fallback | Eager first 12 |
| Category icons | 48×48 | SVG or PNG | Eager |
| Placeholder | 1×1 | Inline base64 gray | Immediate |

```html
<img 
  src="product.webp" 
  srcset="product-200.webp 200w, product-400.webp 400w"
  sizes="(max-width: 768px) 150px, 200px"
  loading="lazy"
  decoding="async"
  alt={product.name}
/>
```

### 9.4 Animation Performance

**Rules:**
- Only animate `transform` and `opacity`
- Use `will-change` sparingly (only on hover/focus intent)
- Keep durations short: 100–200ms for micro-interactions
- Use `prefers-reduced-motion` media query

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Printing & Hardware Integration UX

### 10.1 Receipt Layout (80mm Thermal)

**Constraints:**
- Width: 80mm (72mm printable = ~288px at 96 DPI, 576px at 203 DPI)
- Font: Monospace, 12px equivalent
- No color, no images (except QR optional)
- Line length: ~42 characters

**Receipt Structure:**
```
========================================
          STORE NAME
      Address Line 1
      Address Line 2
      Tel: +218-XX-XXXXXXX
========================================
Date: 2025-12-21       Time: 14:32
Invoice: INV-2025-001234
Cashier: Ahmed
----------------------------------------
ITEM              QTY    PRICE    TOTAL
----------------------------------------
Product Name A      2   10.000   20.000
Product Name B      1   15.500   15.500
----------------------------------------
                   SUBTOTAL:    35.500
                   TAX (0%):     0.000
                   ─────────────────────
                   TOTAL:       35.500
----------------------------------------
PAYMENT
Cash:                            50.000
Change:                          14.500
========================================
        Thank you for your visit!
           شكراً لزيارتكم
========================================
```

### 10.2 Print Preview vs Direct Print

**Strategy:**
1. Always show preview by default
2. "Quick Print" option for experienced users (bypass preview)
3. Fallback to browser print dialog if direct print fails

### 10.3 Peripheral Disconnect UX

| Event | UI Response |
|-------|-------------|
| Printer offline | Toast warning, "Print Later" option saved to queue |
| Scanner disconnect | Show manual barcode input field prominently |
| Cash drawer fail | Toast error, manual acknowledgment button |
| Network offline | Banner + local-first mode, queue operations |

```tsx
// Printer status indicator
<div role="status" aria-live="polite">
  {printerStatus === 'offline' && (
    <Badge variant="warning">
      {t('hardware.printer_offline', 'Printer Offline')}
    </Badge>
  )}
</div>
```

---

## 11. Testing Plan

### 11.1 Unit Tests (Component Snapshot + Behavior)

**Test each component:**

```typescript
// Button.test.tsx
describe('Button', () => {
  it('renders correctly', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container).toMatchSnapshot();
  });
  
  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
  
  it('is disabled when loading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 11.2 Visual Regression Plan

**Pages to Snapshot:**

| Priority | Page/Component | Variants |
|----------|----------------|----------|
| P0 | POSPage | Empty, with items, offline |
| P0 | CheckoutModal | Each step |
| P0 | ReceiptPreview | Standard, long |
| P1 | ProductForm | Create, edit, errors |
| P1 | DataTable | Loading, data, empty |
| P1 | Modal | All sizes |
| P2 | Dashboard | Full |
| P2 | Settings | Each tab |
| P2 | All empty states | - |

**Capture matrix:**
- Breakpoints: 768, 1024, 1366, 1920
- Themes: Light, Dark
- Locales: EN, AR (RTL)

### 11.3 E2E Tests (Playwright)

```typescript
// pos-sale.spec.ts
test.describe('POS Sale Flow', () => {
  test('completes online sale with cash', async ({ page }) => {
    await page.goto('/pos');
    await page.click('[data-testid="product-1"]');
    await page.click('[data-testid="product-2"]');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');
    
    await page.click('[data-testid="checkout-button"]');
    await page.click('[data-testid="payment-cash"]');
    await page.fill('[data-testid="payment-amount"]', '100');
    await page.click('[data-testid="complete-sale"]');
    
    await expect(page.locator('[data-testid="success-modal"]')).toBeVisible();
  });

  test('completes offline sale and syncs', async ({ page, context }) => {
    await context.setOffline(true);
    // ... similar flow
    await context.setOffline(false);
    await expect(page.locator('[data-testid="sync-status"]')).toHaveText('Synced');
  });
});

// product-crud.spec.ts
test('creates new product', async ({ page }) => {
  await page.goto('/products/new');
  await page.fill('[name="name"]', 'Test Product');
  await page.fill('[name="sku"]', 'TEST-001');
  await page.fill('[name="sale_price"]', '25.500');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL(/\/products$/);
});

// inventory.spec.ts
test('adjusts stock quantity', async ({ page }) => {
  await page.goto('/inventory');
  await page.click('[data-testid="adjust-stock-1"]');
  await page.fill('[name="quantity"]', '10');
  await page.selectOption('[name="reason"]', 'received');
  await page.click('[data-testid="save-adjustment"]');
  await expect(page.locator('[data-testid="toast"]')).toContainText('adjusted');
});
```

### 11.4 Acceptance Sign-off Flow

```
1. Developer completes implementation
2. Developer runs unit tests + visual regression
3. QA Engineer runs E2E tests
4. QA Engineer performs manual testing (checklist)
5. Designer reviews visual fidelity (Figma comparison)
6. Product Owner approves functionality
7. Client stakeholder signs off (if major feature)
8. Merge to main branch
```

---

## 12. Phased Implementation Roadmap

### Phase 1: Foundation & Touch Optimization (Week 1-2) ✅ COMPLETE

**Status:** ✅ COMPLETED - December 21, 2025

**Scope:** Core touch targets, button sizes, keypad improvements

**Components/Pages Updated:**
- ✅ Button (all variants now 48px+ height, touch size 72px)
- ✅ NumericKeypad (64px minimum keys with ARIA labels)
- ✅ CartPanel (72px checkout button, 48px action buttons, 44px quantity controls)
- ✅ ProductCard (160px × 180px minimum with improved touch feedback)
- ✅ ProductGrid (48px category tabs, improved responsive grid)
- ✅ Input components (48px height enforced in CSS)
- ✅ SearchInput (44px clear button)
- ✅ CSS tokens (touch-target-lg, touch-target-xl, spacing scale)

**API Dependencies:** None

**Effort:** Medium

**Risk:** Low

**Deliverables:**
- ✅ Updated components with touch optimization
- ✅ ARIA labels for accessibility
- ✅ Touch-manipulation CSS utilities
- ✅ Reduced motion preference support

---

### Phase 2: RTL & Localization Hardening (Week 2-3)

**Scope:** CSS logical properties migration, RTL testing, Arabic polish

**Components/Pages:**
- All components: migrate to logical properties
- Sidebar positioning
- Modal/Drawer animations
- Icon flipping rules
- Number/currency formatting verification

**API Dependencies:** None

**Effort:** Medium

**Risk:** Medium (regression potential)

**Deliverables:**
- RTL visual regression suite
- Localization test coverage

---

### Phase 3: POS Layout & Cart Optimization (Week 3-4)

**Scope:** POS page layout, cart panel UX, checkout flow

**Components/Pages:**
- POSPage layout refinement
- ProductGrid responsive columns
- CartPanel sticky footer
- CheckoutModal keyboard navigation
- Held sales recall flow

**API Dependencies:**
- `GET /api/pos/products`
- `GET /api/pos/payment-methods`
- `POST /api/sales`

**Effort:** High

**Risk:** Medium

**Deliverables:**
- Optimized POS layout for all breakpoints
- E2E tests for sale flows

---

### Phase 4: Receipt & Print Optimization (Week 4-5)

**Scope:** Receipt preview, thermal printer support, hardware status

**Components/Pages:**
- ReceiptPreview component
- Print preview modal
- Printer status indicator
- Print queue for offline

**API Dependencies:**
- `GET /api/sales/{id}/receipt`

**Effort:** Medium

**Risk:** Low

**Deliverables:**
- Receipt component with 80mm layout
- Print E2E tests

---

### Phase 5: Accessibility & Keyboard Navigation (Week 5-6)

**Scope:** WCAG AA compliance, screen reader flows

**Components/Pages:**
- All interactive components: ARIA attributes
- Focus management in modals
- Skip links
- Live regions for cart updates
- Keyboard shortcuts documentation

**API Dependencies:** None

**Effort:** Medium

**Risk:** Low

**Deliverables:**
- Accessibility audit report
- Screen reader test recordings

---

### Phase 6: Visual Polish & Performance (Week 6-7)

**Scope:** Design token refinement, animations, performance optimization

**Components/Pages:**
- All components: shadow/elevation consistency
- Animation timing refinement
- Image lazy loading
- Code splitting verification
- Bundle size optimization

**API Dependencies:** None

**Effort:** Medium

**Risk:** Low

**Deliverables:**
- Lighthouse performance reports
- Final visual regression baselines
- Production-ready build

---

## 13. Deliverables & Artefacts

| Artefact | Format | Owner | Location |
|----------|--------|-------|----------|
| Design Tokens | CSS/JSON | Design Lead | `frontend/src/styles/tokens.css` |
| Figma Component Library | Figma | Designer | Figma project link |
| Storybook | Web | Frontend Dev | `frontend/.storybook` |
| Component Specs | Markdown | Frontend Dev | `docs/components/` |
| Accessibility Report | HTML | QA | `docs/accessibility-audit.html` |
| Visual Regression Baselines | Images | QA | `.playwright/snapshots/` |
| E2E Test Suite | TypeScript | QA | `frontend/e2e/` |
| RTL Testing Guide | Markdown | Frontend Dev | `docs/rtl-testing.md` |
| Rollout Notes | Markdown | Tech Lead | `docs/rollout-notes.md` |

---

## 14. Rollout Strategy & Monitoring

### 14.1 Staged Deployment

```
Stage 1: Internal QA Environment
├── Duration: 3-5 days
├── Audience: QA team, developers
├── Exit criteria: All E2E tests pass, no P0 bugs
│
Stage 2: Pilot Client Site
├── Duration: 1 week
├── Audience: 1 trusted client location
├── Exit criteria: No transaction failures, positive feedback
│
Stage 3: Full Client Rollout
├── Duration: Rolling over 1 week
├── Audience: All client sites
└── Exit criteria: Metrics within thresholds
```

### 14.2 Rollback Plan

1. **Feature flags:** New UI behind feature flag (if feasible)
2. **Blue-green deployment:** Keep previous version ready
3. **Rollback trigger:**
   - Transaction failure rate > 1%
   - Multiple P0 bug reports
   - Client escalation
4. **Rollback procedure:**
   - Revert to previous deployment
   - Notify affected clients
   - Post-mortem within 24 hours

### 14.3 Monitoring Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Transaction success rate | > 99.5% | < 98% |
| Time to complete sale | < 3s p95 | > 5s |
| Visual regression delta | < 0.1% | > 1% |
| JavaScript errors | < 10/hour | > 50/hour |
| API latency | < 200ms p95 | > 500ms |
| Offline queue size | < 10 | > 50 |

---

## 15. Acceptance Criteria

### Critical (Must Pass)

- [ ] **No element overlap:** All interactive elements visible and accessible on tested POS resolutions (768px, 1024px, 1366px, 1920px)
- [ ] **Tap targets:** All primary actions (buttons, product tiles) have ≥48px tap area
- [ ] **WCAG contrast:** All text meets 4.5:1 (normal) or 3:1 (large) contrast ratio
- [ ] **POS flow speed:** Complete sale flow (3 items, cash payment) under 3 seconds perceived on target device (Sunmi POS)
- [ ] **RTL layout:** All pages render correctly in Arabic RTL mode with no visual breaks
- [ ] **Offline sale:** Sale can be completed and queued when network is unavailable
- [ ] **Receipt print:** Receipt renders correctly on 80mm thermal printer

### Important (Should Pass)

- [ ] **Visual regression:** Snapshots match baseline within 0.1% pixel difference
- [ ] **Keyboard navigation:** All POS functions accessible via keyboard alone
- [ ] **Screen reader:** Sale flow can be completed with screen reader (VoiceOver/NVDA)
- [ ] **Load time:** LCP < 2.5s on 4G connection
- [ ] **Error handling:** All API errors show user-friendly toast with retry option

### Nice to Have

- [ ] **Animation smoothness:** No jank (60fps) on product grid scroll
- [ ] **Dark mode:** All components render correctly in dark theme
- [ ] **Reduced motion:** Respects `prefers-reduced-motion` preference

---

## 16. Appendix

### A. Tailwind Token Configuration

```javascript
// tailwind.config.js (v4 compatible)
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      spacing: {
        'touch': '48px',
        'touch-lg': '56px',
        'touch-xl': '64px',
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      fontSize: {
        'price': ['28px', { lineHeight: '1.1', fontWeight: '700' }],
        'price-lg': ['32px', { lineHeight: '1.1', fontWeight: '700' }],
      },
    },
  },
};
```

### B. CSS Logical Properties Patterns

```css
/* Before (physical) */
.card {
  margin-left: 16px;
  padding-right: 24px;
  border-left: 2px solid blue;
  text-align: left;
}

/* After (logical) */
.card {
  margin-inline-start: 16px;
  padding-inline-end: 24px;
  border-inline-start: 2px solid blue;
  text-align: start;
}

/* Positioning */
.sidebar {
  position: fixed;
  inset-inline-start: 0;
  inset-block-start: 0;
  inset-block-end: 0;
  width: var(--sidebar-width);
}

/* RTL-aware transforms */
.icon-forward {
  transform: scaleX(1);
}

html[dir="rtl"] .icon-forward {
  transform: scaleX(-1);
}
```

### C. ARIA Snippets

#### Modal with Focus Trap

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Checkout</h2>
  <p id="modal-description">Complete your purchase</p>
  {/* Focus trap managed by useFocusTrap hook */}
</div>
```

#### Live Region for Cart Updates

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {t('cart.summary', {
    count: items.length,
    total: formatCurrency(total),
  })}
</div>
```

#### NumericKeypad Accessibility

```tsx
<div 
  role="group" 
  aria-label={t('keypad.label', 'Numeric keypad for entering amounts')}
>
  {keys.map(key => (
    <button
      key={key}
      aria-label={key === '.' ? t('keypad.decimal', 'Decimal point') : key}
      onClick={() => onKeyPress(key)}
    >
      {key}
    </button>
  ))}
  <button aria-label={t('keypad.backspace', 'Delete last digit')}>
    <BackspaceIcon />
  </button>
  <button aria-label={t('keypad.clear', 'Clear all')}>
    C
  </button>
</div>
```

#### Offline Status Announcement

```tsx
<div 
  role="status" 
  aria-live="assertive"
  aria-atomic="true"
>
  {!isOnline && (
    <span className="sr-only">
      {t('status.offline_announcement', 'You are now working offline. Sales will be synced when connection is restored.')}
    </span>
  )}
</div>
```

---

### D. Prioritized Developer Checklist

**Immediate Actions (This Week):**

- [ ] Audit all Button usages, ensure min-height 48px
- [ ] Update NumericKeypad key size to 64px
- [ ] Add `min-height: 64px` to cart item rows
- [ ] Ensure checkout button is 72px height and always visible
- [ ] Add RTL snapshot tests for POSPage and CartPanel

**Short Term (Week 2-3):**

- [ ] Migrate all margin/padding to logical properties
- [ ] Add `aria-live` region to CartPanel for totals
- [ ] Implement focus trap in CheckoutModal
- [ ] Add keyboard shortcuts help modal
- [ ] Create visual regression baselines

**Medium Term (Week 4-6):**

- [ ] Optimize ReceiptPreview for 80mm thermal
- [ ] Add printer status indicator
- [ ] Complete accessibility audit
- [ ] Performance optimization pass
- [ ] Full E2E test coverage

---

*End of Document*
