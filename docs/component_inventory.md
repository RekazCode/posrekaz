# React Component Inventory

## Design System

### Color Palette
```css
:root {
  /* Primary - Modern Blue */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  
  /* Success - Green */
  --success-500: #22c55e;
  
  /* Warning - Amber */
  --warning-500: #f59e0b;
  
  /* Error - Red */
  --error-500: #ef4444;
  
  /* Neutral */
  --gray-50: #f9fafb;
  --gray-900: #111827;
}
```

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: 600-700 weight
- **Body**: 400-500 weight
- **RTL**: System Arabic fallback

---

## Core Components

### Layout
| Component | Description |
|-----------|-------------|
| `AppShell` | Main layout with sidebar, header |
| `Sidebar` | Navigation menu, collapsible |
| `Header` | User menu, locale switch, notifications |
| `PageHeader` | Title, breadcrumbs, actions |

### Forms
| Component | Description |
|-----------|-------------|
| `Input` | Text input with label, error |
| `Select` | Dropdown with search |
| `DatePicker` | Date/time picker |
| `CurrencyInput` | LYD formatted input |
| `FileUpload` | Image/document upload |

### Data Display
| Component | Description |
|-----------|-------------|
| `DataTable` | Sortable, filterable table |
| `Card` | Content card with header |
| `Badge` | Status indicators |
| `Avatar` | User/product image |

### POS Specific
| Component | Description |
|-----------|-------------|
| `POSLayout` | Fullscreen POS layout |
| `ProductGrid` | Touch-friendly product tiles |
| `Cart` | Shopping cart with totals |
| `PaymentModal` | Split payment interface |
| `NumPad` | Touch number pad |
| `ReceiptPreview` | Print preview |
| `SyncStatus` | Online/offline indicator |

### Feedback
| Component | Description |
|-----------|-------------|
| `Toast` | Notifications |
| `Modal` | Dialog windows |
| `ConfirmDialog` | Confirmation prompts |
| `LoadingSpinner` | Loading states |

---

## Page Inventory

### Auth
- `/login` - Login form
- `/forgot-password` - Password reset

### Dashboard
- `/` - KPI dashboard

### Products
- `/products` - Product list
- `/products/new` - Create product
- `/products/:id` - Edit product
- `/categories` - Category management

### Inventory
- `/inventory` - Stock levels
- `/inventory/adjustments` - Stock adjustments
- `/inventory/transfers` - Stock transfers
- `/warehouses` - Warehouse management

### Sales
- `/pos` - POS interface (fullscreen)
- `/sales` - Sales history
- `/sales/:id` - Sale details
- `/returns` - Returns management

### Customers
- `/customers` - Customer list
- `/customers/:id` - Customer profile

### Purchases
- `/suppliers` - Supplier list
- `/purchase-orders` - PO list
- `/purchase-orders/new` - Create PO

### Reports
- `/reports/sales` - Sales reports
- `/reports/inventory` - Stock reports
- `/reports/cash` - Cash reports

### Settings
- `/settings/general` - Business profile
- `/settings/users` - User management
- `/settings/roles` - Role/permission editor
- `/settings/printers` - Printer config

---

## Layout Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Desktop | 1280px+ | Sidebar + content |
| Tablet | 768-1279px | Collapsible sidebar |
| Kiosk | 1024x768+ | Fullscreen POS |
| Mobile | <768px | Bottom nav (limited) |

## Accessibility
- Touch targets: minimum 48x48px
- Focus indicators visible
- Screen reader labels
- Keyboard navigation support
