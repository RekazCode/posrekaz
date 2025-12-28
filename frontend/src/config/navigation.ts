/**
 * Navigation configuration with permission-based access control.
 * Each nav item maps to backend permissions.
 */

export interface NavItem {
  id: string;
  label: string;           // Translation key
  labelFallback: string;   // Fallback English text
  path: string;
  icon: string;            // Emoji for now (can be replaced with icon component)
  permission?: string;     // Required permission (undefined = always visible)
  permissions?: string[];  // Any of these permissions grants access
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title: string;           // Translation key
  titleFallback: string;   // Fallback English text
  items: NavItem[];
}

/**
 * Main navigation structure.
 * Items are only shown if user has the required permission.
 */
export const navigationConfig: NavSection[] = [
  {
    id: 'main',
    title: 'nav.main',
    titleFallback: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'nav.dashboard',
        labelFallback: 'Dashboard',
        path: '/',
        icon: '📊',
        // Dashboard is always visible to authenticated users
      },
      {
        id: 'pos',
        label: 'nav.pos',
        labelFallback: 'Point of Sale',
        path: '/pos',
        icon: '🛒',
        permission: 'pos.access',
      },
    ],
  },
  {
    id: 'catalog',
    title: 'nav.catalog',
    titleFallback: 'Catalog',
    items: [
      {
        id: 'products',
        label: 'nav.products',
        labelFallback: 'Products',
        path: '/products',
        icon: '📦',
        permission: 'products.view',
      },
      {
        id: 'inventory',
        label: 'nav.inventory',
        labelFallback: 'Inventory',
        path: '/inventory',
        icon: '📋',
        permission: 'inventory.view',
      },
    ],
  },
  {
    id: 'operations',
    title: 'nav.operations',
    titleFallback: 'Operations',
    items: [
      {
        id: 'sales',
        label: 'nav.sales',
        labelFallback: 'Sales',
        path: '/sales',
        icon: '💰',
        permission: 'sales.view',
      },
      {
        id: 'purchases',
        label: 'nav.purchases',
        labelFallback: 'Purchases',
        path: '/purchases',
        icon: '📋',
        permission: 'purchases.view',
      },
      {
        id: 'suppliers',
        label: 'nav.suppliers',
        labelFallback: 'Suppliers',
        path: '/suppliers',
        icon: '🏭',
        permission: 'suppliers.view',
      },
    ],
  },
  {
    id: 'reports',
    title: 'nav.reports',
    titleFallback: 'Reports',
    items: [
      {
        id: 'reports',
        label: 'nav.reports',
        labelFallback: 'Reports',
        path: '/reports',
        icon: '📈',
        permission: 'reports.view',
      },
    ],
  },
  {
    id: 'admin',
    title: 'nav.administration',
    titleFallback: 'Administration',
    items: [
      {
        id: 'users',
        label: 'nav.users',
        labelFallback: 'Users',
        path: '/users',
        icon: '👥',
        permission: 'users.view',
      },
      {
        id: 'roles',
        label: 'nav.roles',
        labelFallback: 'Roles',
        path: '/roles',
        icon: '🔐',
        permission: 'roles.view',
      },
      {
        id: 'settings',
        label: 'nav.settings',
        labelFallback: 'Settings',
        path: '/settings',
        icon: '⚙️',
        permission: 'settings.view',
      },
      {
        id: 'audit',
        label: 'nav.audit',
        labelFallback: 'Audit Log',
        path: '/audit',
        icon: '📜',
        permission: 'audit.view',
      },
    ],
  },
];

/**
 * Filter navigation items based on user permissions.
 */
export function filterNavigation(
  sections: NavSection[],
  hasPermission: (permission: string) => boolean,
  hasAnyPermission: (permissions: string[]) => boolean
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // No permission required - always show
        if (!item.permission && !item.permissions) return true;
        
        // Check single permission
        if (item.permission) return hasPermission(item.permission);
        
        // Check any of multiple permissions
        if (item.permissions) return hasAnyPermission(item.permissions);
        
        return false;
      }),
    }))
    .filter((section) => section.items.length > 0);  // Remove empty sections
}
