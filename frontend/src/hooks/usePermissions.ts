import { useMemo, useCallback } from 'react';
import { useAuthStore } from '../stores';

/**
 * Hook for checking user permissions.
 * Returns utilities for permission-based UI rendering.
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuthStore();

  // Extract permission names into a Set for O(1) lookups
  // Access user.permissions directly (user is checked in the condition)
  const permissionNames = useMemo(() => {
    if (!user || !user.permissions) return new Set<string>();
    return new Set(user.permissions.map(p => p.name));
  }, [user]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!isAuthenticated || !user) return false;
      return permissionNames.has(permission);
    },
    [isAuthenticated, user, permissionNames]
  );

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!isAuthenticated || !user) return false;
      return permissions.every(p => permissionNames.has(p));
    },
    [isAuthenticated, user, permissionNames]
  );

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!isAuthenticated || !user) return false;
      return permissions.some(p => permissionNames.has(p));
    },
    [isAuthenticated, user, permissionNames]
  );

  /**
   * Get user's primary role (first role in array)
   */
  const primaryRole = useMemo(() => {
    if (!user || !user.roles || !user.roles.length) return null;
    return user.roles[0];
  }, [user]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!isAuthenticated || !user || !user.roles) return false;
      return user.roles.includes(role);
    },
    [isAuthenticated, user]
  );

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    primaryRole,
    permissions: permissionNames,
    isAuthenticated,
  };
}

export default usePermissions;
