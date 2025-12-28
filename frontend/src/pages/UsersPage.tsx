/**
 * Users Management Page - Full implementation
 * User CRUD, role assignment, status management
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks';
import {
  DataTable,
  SearchInput,
  Badge,
  Modal,
  ConfirmDialog,
} from '../components/ui';
import { FormField, FormActions, FormError } from '../components/forms';
import { usersApi, rolesApi } from '../lib/apiClient';
import type { User, Role } from '../types';
import type { Column } from '../components/ui';

export function UsersPage() {
  const { t, locale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.list({
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      });
      // Filter by role locally if roleFilter is set
      let filteredUsers = response.data;
      if (roleFilter) {
        filteredUsers = response.data.filter(user => 
          user.roles?.some(r => typeof r === 'string' ? false : r.id === roleFilter)
        );
      }
      setUsers(filteredUsers);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'Failed to load users'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, roleFilter, statusFilter, t]);

  // Load roles
  const loadRoles = useCallback(async () => {
    try {
      const response = await rolesApi.list();
      setRoles(response.data);
    } catch {
      // Failed to load roles
    }
  }, []);

  // Delete user
  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    try {
      await usersApi.delete(deletingUser.id);
      toast.success(t('users.deleted', 'User deleted successfully'));
      setDeletingUser(null);
      loadUsers();
    } catch {
      toast.error(t('error.delete_failed', 'Failed to delete user'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (user: User) => {
    try {
      await usersApi.toggleActive(user.id);
      toast.success(
        user.is_active
          ? t('users.deactivated', 'User deactivated')
          : t('users.activated', 'User activated')
      );
      loadUsers();
    } catch {
      toast.error(t('error.update_failed', 'Failed to update user'));
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, roleFilter, statusFilter]);

  // Table columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('users.name', 'Name'),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
              {user.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: t('users.roles', 'Roles'),
      hideOnMobile: true,
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles?.map((role, idx) => (
            <Badge key={typeof role === 'string' ? idx : role.id} variant="info" size="sm">
              {typeof role === 'string' ? role : role.name}
            </Badge>
          )) || '-'}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: t('users.status', 'Status'),
      align: 'center',
      width: '100px',
      render: (user) => (
        <Badge variant={user.is_active ? 'success' : 'danger'} dot>
          {user.is_active ? t('users.active', 'Active') : t('users.inactive', 'Inactive')}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: t('users.last_login', 'Last Login'),
      hideOnMobile: true,
      render: (user) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {user.last_login_at
            ? new Date(user.last_login_at).toLocaleDateString(locale)
            : t('users.never', 'Never')}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: t('users.created', 'Created'),
      hideOnMobile: true,
      render: (user) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {new Date(user.created_at).toLocaleDateString(locale)}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions = (user: User) => (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
        <>
          <button
            onClick={() => {
              setEditingUser(user);
              setShowForm(true);
            }}
            className="btn btn-ghost p-2"
            title={t('common.edit', 'Edit')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleToggleActive(user)}
            className="btn btn-ghost p-2"
            title={user.is_active ? t('users.deactivate', 'Deactivate') : t('users.activate', 'Activate')}
          >
            {user.is_active ? (
              <svg className="w-4 h-4" style={{ color: 'var(--color-warning-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: 'var(--color-success-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </>
      )}
      {canDelete && (
        <button
          onClick={() => setDeletingUser(user)}
          className="btn btn-ghost p-2"
          style={{ color: 'var(--color-error-600)' }}
          title={t('common.delete', 'Delete')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );

  // Role filter options
  const roleOptions = [
    { value: '', label: t('common.all_roles', 'All Roles') },
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];

  // Status filter options
  const statusOptions = [
    { value: '', label: t('common.all_statuses', 'All Statuses') },
    { value: 'active', label: t('users.active', 'Active') },
    { value: 'inactive', label: t('users.inactive', 'Inactive') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.users', 'Users')}
        </h1>
        {canCreate && (
          <button
            onClick={() => {
              setEditingUser(null);
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('users.add', 'Add User')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('users.search_placeholder', 'Search by name or email...')}
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter || ''}
            onChange={(e) => setRoleFilter(e.target.value ? parseInt(e.target.value) : null)}
            className="input"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyIcon="👥"
          emptyTitle={t('users.empty', 'No users found')}
          emptyDescription={t('users.empty_desc', 'Create a new user to get started')}
          rowActions={canEdit || canDelete ? rowActions : undefined}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        user={editingUser}
        roles={roles}
        onSuccess={() => {
          setShowForm(false);
          loadUsers();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title={t('users.delete_user', 'Delete User')}
        message={t('users.delete_confirm', 'Are you sure you want to delete this user? This action cannot be undone.')}
        confirmLabel={t('common.delete', 'Delete')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

// User Form Modal Component
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
  onSuccess: () => void;
}

function UserFormModal({ isOpen, onClose, user, roles, onSuccess }: UserFormModalProps) {
  const { t } = useLocaleStore();
  const isEdit = user !== null;

  interface UserFormDataInternal {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
    role_ids: number[];
  }

  const [formData, setFormData] = useState<UserFormDataInternal>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_active: true,
    role_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          password: '',
          password_confirmation: '',
          is_active: user.is_active,
          role_ids: user.roles?.map((r) => typeof r === 'string' ? 0 : r.id).filter(id => id > 0) || [],
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
          is_active: true,
          role_ids: [],
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.required', 'This field is required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.required', 'This field is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.email', 'Invalid email format');
    }
    if (!isEdit && !formData.password) {
      newErrors.password = t('validation.required', 'This field is required');
    }
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = t('validation.password_min', 'Must be at least 8 characters');
      } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
        newErrors.password = t('validation.password_mixed_case', 'Must contain uppercase and lowercase letters');
      } else if (!/(?=.*\d)/.test(formData.password)) {
        newErrors.password = t('validation.password_numbers', 'Must contain at least one number');
      }
    }
    if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = t('validation.password_match', 'Passwords do not match');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      if (isEdit && user) {
        const updateData: { name?: string; email?: string; is_active?: boolean; password?: string; password_confirmation?: string } = {
          name: formData.name,
          email: formData.email,
        };
        if (formData.password) {
          updateData.password = formData.password;
          updateData.password_confirmation = formData.password_confirmation;
        }
        await usersApi.update(user.id, updateData);
        // Update roles separately
        await usersApi.assignRoles(user.id, formData.role_ids);
        toast.success(t('users.updated', 'User updated successfully'));
      } else {
        await usersApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roles: formData.role_ids, // Send roles directly on creation
        });
        toast.success(t('users.created', 'User created successfully'));
      }
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'Failed to save')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('users.edit_user', 'Edit User') : t('users.add_user', 'Add User')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        <div className="grid grid-cols-1 gap-4">
          <FormField
            label={t('users.name', 'Name')}
            required
            error={errors.name}
          >
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder={t('users.name_placeholder', 'Enter full name')}
            />
          </FormField>

          <FormField
            label={t('users.email', 'Email')}
            required
            error={errors.email}
          >
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder={t('users.email_placeholder', 'name@company.com')}
            />
          </FormField>

          <FormField
            label={t('users.password', 'Password')}
            required={!isEdit}
            hint={isEdit ? t('users.password_hint', 'Leave blank to keep current password') : undefined}
            error={errors.password}
          >
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder={isEdit ? '••••••••' : t('users.password_placeholder', 'Min 8 chars, A-Z, a-z, 0-9')}
            />
          </FormField>

          {formData.password && (
            <FormField
              label={t('users.confirm_password', 'Confirm Password')}
              required
              error={errors.password_confirmation}
            >
              <input
                type="password"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                className={`input ${errors.password_confirmation ? 'input-error' : ''}`}
                placeholder={t('users.confirm_placeholder', 'Repeat password')}
              />
            </FormField>
          )}

          {/* Roles */}
          <FormField label={t('users.roles', 'Roles')}>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleToggle(role.id)}
                  className="px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: formData.role_ids.includes(role.id)
                      ? 'var(--color-primary-600)'
                      : 'var(--color-gray-300)',
                    backgroundColor: formData.role_ids.includes(role.id)
                      ? 'var(--color-primary-50)'
                      : 'var(--color-white)',
                    color: formData.role_ids.includes(role.id)
                      ? 'var(--color-primary-700)'
                      : 'var(--color-gray-700)',
                  }}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </FormField>

          {/* Active status */}
          <FormField label={t('users.status', 'Status')}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded"
                style={{ accentColor: 'var(--color-primary-600)' }}
              />
              <span style={{ color: 'var(--color-gray-700)' }}>
                {t('users.user_active', 'User is active')}
              </span>
            </label>
          </FormField>
        </div>

        <FormActions
          onCancel={onClose}
          isSubmitting={isLoading}
          submitLabel={isEdit ? t('common.save', 'Save') : t('users.create', 'Create User')}
        />
      </form>
    </Modal>
  );
}

export default UsersPage;
