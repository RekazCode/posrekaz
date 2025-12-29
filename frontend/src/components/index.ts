export { ErrorBoundary } from './ErrorBoundary';
export { ProtectedRoute } from './ProtectedRoute';
export { LocaleSwitcher } from './LocaleSwitcher';
export { AppShell } from './AppShell';
export { Sidebar } from './Sidebar';
export { UserMenu } from './UserMenu';

// Inventory components
export { TransferModal, WarehouseModal, ReconciliationQueue } from './inventory';

// Purchase Order components
export { POCreateModal, SupplierReturnModal, InvoiceCreateModal, InvoiceDetailModal, SupplierQuickAddModal } from './purchases';

// Chart components
export { SalesLineChart, SalesPieChart, RevenueBarChart, TrendSparkline } from './charts';

// Offline components
export { OfflineIndicator, SyncStatusCard } from './offline';

// System components
export { SystemUpdateCard } from './system';
export type { VersionInfo, ChangelogEntry, UpdateProgress } from './system';
