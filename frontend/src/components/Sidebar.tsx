import { NavLink } from 'react-router-dom';
import { useAuthStore, useLocaleStore } from '../stores';
import { usePermissions } from '../hooks';
import { navigationConfig, filterNavigation } from '../config';
import type { NavItem, NavSection } from '../config';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Sidebar navigation component.
 * Filters navigation items based on user permissions.
 * RTL-aware positioning and styling.
 */
export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user } = useAuthStore();
  const { t } = useLocaleStore();
  const { hasPermission, hasAnyPermission, primaryRole } = usePermissions();

  // Filter navigation based on permissions
  const filteredNavigation = filterNavigation(
    navigationConfig,
    hasPermission,
    hasAnyPermission
  );

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
  const formatRole = (role: string | { name: string } | null): string => {
    if (!role) return 'User';
    const roleName = typeof role === 'string' ? role : role.name;
    return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          style={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        aria-label={t('nav.sidebar', 'Main navigation')}
      >
        {/* Logo/Header */}
        <div style={{
          ...styles.header,
          justifyContent: isCollapsed ? 'center' : 'space-between',
          paddingInlineStart: isCollapsed ? '0' : '1rem',
          paddingInlineEnd: isCollapsed ? '0' : '1rem',
        }}>
          <div style={{
            ...styles.logoContainer,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}>
            <span style={styles.logoIcon}>🏪</span>
            {!isCollapsed && <h1 style={styles.logo}>POS System</h1>}
          </div>
          
          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            style={{
              ...styles.collapseButton,
              display: 'flex', // We use className hidden md:flex to control visibility
            }}
            className="sidebar-collapse-btn hidden md:flex items-center justify-center w-8 h-8 bg-transparent border-none text-gray-400 cursor-pointer rounded hover:bg-gray-800 hover:text-white transition-colors"
            aria-label={isCollapsed ? t('nav.expand', 'Expand') : t('nav.collapse', 'Collapse')}
          >
            {isCollapsed ? '«' : '»'}
          </button>
          
          {/* Mobile close button */}
          <button
            onClick={onClose}
            style={styles.closeButton}
            className="sidebar-close-btn md:hidden"
            aria-label={t('nav.close', 'Close navigation')}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {filteredNavigation.map((section) => (
            <NavSection 
              key={section.id} 
              section={section} 
              t={t}
              onItemClick={onClose}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* User info at bottom */}
        <div style={{
          ...styles.footer,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}>
          <div style={styles.userCard}>
            <div style={styles.avatar}>{userInitial}</div>
            {!isCollapsed && (
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user?.name}</span>
                <span style={styles.userRole}>{formatRole(primaryRole)}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

interface NavSectionProps {
  section: NavSection;
  t: (key: string, fallback?: string) => string;
  onItemClick: () => void;
  isCollapsed: boolean;
}

function NavSection({ section, t, onItemClick, isCollapsed }: NavSectionProps) {
  // Don't render section title for "main" section
  const showTitle = section.id !== 'main' && !isCollapsed;

  return (
    <div style={styles.section}>
      {showTitle && (
        <div style={styles.sectionTitle}>
          {t(section.title, section.titleFallback)}
        </div>
      )}
      {section.items.map((item) => (
        <NavItem 
          key={item.id} 
          item={item} 
          t={t} 
          onItemClick={onItemClick}
          isCollapsed={isCollapsed}
        />
      ))}
    </div>
  );
}

interface NavItemProps {
  item: NavItem;
  t: (key: string, fallback?: string) => string;
  onItemClick: () => void;
  isCollapsed: boolean;
}

function NavItem({ item, t, onItemClick, isCollapsed }: NavItemProps) {
  return (
    <NavLink
      to={item.path}
      onClick={onItemClick}
      style={({ isActive }) => ({
        ...styles.navLink,
        ...(isActive ? styles.navLinkActive : {}),
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        paddingInline: isCollapsed ? '0' : '1rem',
      })}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
      title={isCollapsed ? t(item.label, item.labelFallback) : undefined}
    >
      <span style={styles.navIcon}>{item.icon}</span>
      {!isCollapsed && <span style={styles.navLabel}>{t(item.label, item.labelFallback)}</span>}
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 40,
  },
  sidebar: {
    position: 'fixed',
    insetBlockStart: 0,
    insetBlockEnd: 0,
    insetInlineStart: 0,
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--color-gray-900)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
    transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--header-height)',
    paddingInlineStart: '1rem',
    paddingInlineEnd: '1rem',
    borderBottom: '1px solid var(--color-gray-700)',
    flexShrink: 0,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  logo: {
    fontSize: '1.125rem',
    fontWeight: 700,
    margin: 0,
    whiteSpace: 'nowrap',
  },
  closeButton: {
    display: 'none', // Shown via CSS on mobile
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-gray-400)',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    fontSize: '1rem',
  },
  collapseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-gray-400)',
    cursor: 'pointer',
    borderRadius: '0.375rem',
    fontSize: '1.25rem',
    transition: 'background-color 0.15s, color 0.15s',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 0',
  },
  section: {
    marginBottom: '1rem',
  },
  sectionTitle: {
    padding: '0.5rem 1rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-gray-500)',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 1rem',
    marginInline: '0.5rem',
    borderRadius: '0.5rem',
    color: 'var(--color-gray-300)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'background-color 0.15s, color 0.15s',
  },
  navLinkActive: {
    backgroundColor: 'var(--color-primary-600)',
    color: 'white',
  },
  navIcon: {
    fontSize: '1.125rem',
    width: '1.5rem',
    textAlign: 'center',
    flexShrink: 0,
  },
  navLabel: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  footer: {
    flexShrink: 0,
    padding: '1rem',
    borderTop: '1px solid var(--color-gray-700)',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-500)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--color-gray-400)',
  },
};

export default Sidebar;
