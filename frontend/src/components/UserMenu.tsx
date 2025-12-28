import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useLocaleStore } from '../stores';
import { LocaleSwitcher } from './LocaleSwitcher';

/**
 * User menu dropdown in the header.
 * Shows user info, locale switcher, and logout.
 * RTL-aware positioning.
 */
export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const { t } = useLocaleStore();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
  const primaryRole = user?.roles?.[0] || 'User';

  // Format role name for display
  const formatRole = (role: string | { name: string }): string => {
    const roleName = typeof role === 'string' ? role : role.name;
    return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
  };

  return (
    <div ref={menuRef} style={styles.container}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.trigger}
        className="touch-target"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('user.menu', 'User menu')}
      >
        <span style={styles.avatar}>{userInitial}</span>
        <span style={styles.userName}>{user?.name}</span>
        <span style={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          style={styles.dropdown}
          role="menu"
        >
          {/* User Info */}
          <div style={styles.userInfo}>
            <div style={styles.avatarLarge}>{userInitial}</div>
            <div style={styles.userDetails}>
              <span style={styles.userNameLarge}>{user?.name}</span>
              <span style={styles.userEmail}>{user?.email}</span>
              <span style={styles.userRole}>{formatRole(primaryRole)}</span>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Locale Switcher */}
          <div style={styles.menuItem} role="menuitem">
            <span style={styles.menuLabel}>{t('settings.language', 'Language')}</span>
            <LocaleSwitcher />
          </div>

          <div style={styles.divider} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            role="menuitem"
          >
            <span>🚪</span>
            <span>{t('auth.logout', 'Logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-gray-200)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
  },
  avatar: {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-500)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--color-gray-700)',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: '0.625rem',
    color: 'var(--color-gray-400)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    insetInlineEnd: 0,
    minWidth: '280px',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
    border: '1px solid var(--color-gray-200)',
    zIndex: 50,
    overflow: 'hidden',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
  },
  avatarLarge: {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-500)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  userNameLarge: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--color-gray-900)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userEmail: {
    fontSize: '0.8125rem',
    color: 'var(--color-gray-500)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--color-primary-600)',
    fontWeight: 500,
    marginTop: '0.125rem',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--color-gray-100)',
    margin: '0 0.5rem',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
  },
  menuLabel: {
    fontSize: '0.875rem',
    color: 'var(--color-gray-700)',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--color-danger-600)',
    transition: 'background-color 0.15s',
    textAlign: 'start',
  },
};

export default UserMenu;
