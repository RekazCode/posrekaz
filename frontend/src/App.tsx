import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary, ProtectedRoute, AppShell } from './components';
import { LoginPage } from './pages';
import { useAuthStore, useLocaleStore } from './stores';
import { LoadingSpinner } from './components/ui';
import { useGlobalErrorHandler } from './lib/globalErrorHandler';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const POSPage = lazy(() => import('./pages/POSPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
// const AuditPage = lazy(() => import('./pages/AuditPage'));

// Suspense fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <LoadingSpinner size="lg" />
    </div>
  );
}

function AppRoutes() {
  const { checkAuth, isLoading } = useAuthStore();
  const { locale, direction, loadTranslations } = useLocaleStore();

  // Set up global error handler
  useGlobalErrorHandler();

  // Check auth and load translations on mount (intentionally runs only once)
  useEffect(() => {
    console.log('🚀 App initializing...');
    checkAuth();
    loadTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update HTML attributes when locale changes
  useEffect(() => {
    console.log('🌍 Locale changed:', locale, direction);
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  // Show loading while checking auth
  if (isLoading) {
    console.log('⏳ App is loading (checking auth)...');
    return (
      <div style={styles.loading}>
        <div className="spinner" style={styles.spinner}></div>
      </div>
    );
  }

  console.log('✅ App ready, rendering routes...');
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes - all require authentication */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - always accessible to authenticated users */}
        <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />

        {/* POS - requires pos.access */}
        <Route path="pos" element={<Suspense fallback={<PageLoader />}><POSPage /></Suspense>} />

        {/* Catalog */}
        <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
        <Route path="inventory" element={<Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>} />

        {/* Operations */}
        <Route path="sales" element={<Suspense fallback={<PageLoader />}><SalesPage /></Suspense>} />
        <Route path="purchases" element={<Suspense fallback={<PageLoader />}><PurchasesPage /></Suspense>} />
        <Route path="suppliers" element={<Suspense fallback={<PageLoader />}><SuppliersPage /></Suspense>} />

        {/* Reports */}
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />

        {/* Administration */}
        <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
        <Route path="roles" element={<Suspense fallback={<PageLoader />}><RolesPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
        {/* <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditPage /></Suspense>} /> */}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  spinner: {
    width: '2.5rem',
    height: '2.5rem',
  },
};

export default App;
