import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useLocaleStore } from '../stores';
import { useOfflineStore } from '../stores/offlineStore';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';
import { OfflineIndicator } from './offline';

/**
 * Main application shell with responsive sidebar and header.
 * Desktop: Fixed sidebar, scrollable content
 * Mobile: Collapsible sidebar with overlay
 * RTL-aware layout using CSS logical properties.
 */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { t } = useLocaleStore();
  const { initializeOffline } = useOfflineStore();

  // Initialize offline store on mount
  useEffect(() => {
    initializeOffline();
  }, [initializeOffline]);

  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebarCollapse = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);

  return (
    <div style={styles.container}>
      {/* Skip Link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        style={{ textDecoration: 'none' }}
      >
        {t('nav.skip_to_main', 'Skip to main content')}
      </a>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main content area */}
      <div 
        style={{
          ...styles.main,
          marginInlineStart: isSidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        }}
        className="main-content"
        role="region"
        aria-label={t('nav.main_content', 'Main content')}
      >
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            {/* Left side: Mobile menu button */}
            <div style={styles.headerLeft}>
              <button
                onClick={handleOpenSidebar}
                style={styles.menuButton}
                className="mobile-menu-btn touch-target"
                aria-label={t('nav.open', 'Open navigation')}
              >
                <span style={styles.menuIcon}>☰</span>
              </button>
              
              {/* Page title placeholder - can be filled by pages */}
              <div id="page-title" style={styles.pageTitle}></div>
            </div>

            {/* Right side: Offline indicator + User menu */}
            <div style={styles.headerRight}>
              <OfflineIndicator variant="compact" showPendingCount />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" style={styles.content} role="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-gray-50)',
  },
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    marginInlineStart: 'var(--sidebar-width)',
    transition: 'margin 0.3s ease-in-out',
  },
  header: {
    height: 'var(--header-height)',
    backgroundColor: 'white',
    borderBottom: '1px solid var(--color-gray-200)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  },
  headerContent: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInlineStart: '1rem',
    paddingInlineEnd: '1rem',
    gap: '1rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  menuButton: {
    display: 'none', // Shown via CSS on mobile
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-gray-200)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  menuIcon: {
    fontSize: '1.25rem',
    color: 'var(--color-gray-600)',
  },
  pageTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--color-gray-900)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  content: {
    flex: 1,
    padding: '1.5rem',
  },
};

export default AppShell;
