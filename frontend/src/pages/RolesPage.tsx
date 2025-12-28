/**
 * Roles Management Page - Full implementation
 * Role CRUD with permission assignment
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
import { rolesApi, permissionsApi } from '../lib/apiClient';
import type { Role, Permission } from '../types';
import type { Column } from '../components/ui';

interface RoleFormData {
  name: string;
  description: string;
  permission_ids: number[];
}

// Group permissions by module
function groupPermissions(permissions: Permission[]): Map<string, Permission[]> {
  const groups = new Map<string, Permission[]>();
  permissions.forEach((p) => {
    const module = p.group || p.name.split('.')[0];
    if (!groups.has(module)) {
      groups.set(module, []);
    }
    groups.get(module)!.push(p);
  });
  return groups;
}

// Translate module name to Arabic
function translateModuleName(module: string, t: (key: string, fallback: string) => string): string {
  const translations: Record<string, string> = {
    'products': t('permissions.module_products', 'المنتجات'),
    'categories': t('permissions.module_categories', 'التصنيفات'),
    'inventory': t('permissions.module_inventory', 'المخزون'),
    'sales': t('permissions.module_sales', 'المبيعات'),
    'purchases': t('permissions.module_purchases', 'المشتريات'),
    'suppliers': t('permissions.module_suppliers', 'الموردين'),
    'customers': t('permissions.module_customers', 'العملاء'),
    'users': t('permissions.module_users', 'المستخدمين'),
    'roles': t('permissions.module_roles', 'الأدوار'),
    'reports': t('permissions.module_reports', 'التقارير'),
    'settings': t('permissions.module_settings', 'الإعدادات'),
    'warehouses': t('permissions.module_warehouses', 'المستودعات'),
    'pos': t('permissions.module_pos', 'نقاط البيع'),
    'payment_methods': t('permissions.module_payment_methods', 'طرق الدفع'),
    'audit': t('permissions.module_audit', 'سجلات التدقيق'),
    'offline': t('permissions.module_offline', 'المتصل/غير المتصل'),
    'reconciliation': t('permissions.module_reconciliation', 'التوفيق'),
  };
  return translations[module] || module;
}

// Translate permission action to Arabic
function translatePermissionAction(action: string, t: (key: string, fallback: string) => string): string {
  const translations: Record<string, string> = {
    'view': t('permissions.action_view', 'عرض'),
    'create': t('permissions.action_create', 'إضافة'),
    'update': t('permissions.action_update', 'تحديث'),
    'edit': t('permissions.action_edit', 'تعديل'),
    'delete': t('permissions.action_delete', 'حذف'),
    'manage': t('permissions.action_manage', 'إدارة'),
    'export': t('permissions.action_export', 'تصدير'),
    'import': t('permissions.action_import', 'استيراد'),
    'assign_roles': t('permissions.action_assign_roles', 'إسناد الأدوار'),
    'refund': t('permissions.action_refund', 'استرجاع'),
    'access': t('permissions.action_access', 'الوصول'),
    'void_sale': t('permissions.action_void_sale', 'إلغاء مبيعة'),
    'apply_discount': t('permissions.action_apply_discount', 'تطبيق خصم'),
    'adjust': t('permissions.action_adjust', 'تعديل'),
    'receive': t('permissions.action_receive', 'استقبال'),
    'return': t('permissions.action_return', 'استرجاع'),
    'sync': t('permissions.action_sync', 'مزامنة'),
    'resolve_conflicts': t('permissions.action_resolve_conflicts', 'حل النزاعات'),
  };
  return translations[action] || action;
}

export function RolesPage() {
  const { t, locale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canCreate = hasPermission('roles.create');
  const canEdit = hasPermission('roles.edit');
  const canDelete = hasPermission('roles.delete');

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15,
  });

  // Filters
  const [search, setSearch] = useState('');

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load roles
  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await rolesApi.list({
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
      });
      setRoles(response.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'فشل في تحميل الأدوار'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, t]);

  // Load permissions
  const loadPermissions = useCallback(async () => {
    try {
      const data = await permissionsApi.list();
      setPermissions(data);
    } catch {
      // Failed to load permissions
    }
  }, []);

  // Delete role
  const handleDelete = async () => {
    if (!deletingRole) return;

    setIsDeleting(true);
    try {
      await rolesApi.delete(deletingRole.id);
      toast.success(t('roles.deleted', 'تم حذف الدور بنجاح'));
      setDeletingRole(null);
      loadRoles();
    } catch {
      toast.error(t('error.delete_failed', 'فشل في حذف الدور'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search]);

  // Table columns
  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: t('roles.name', 'الاسم'),
      sortable: true,
      render: (role) => (
        <div>
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {role.name}
          </span>
          {role.is_system && (
            <Badge variant="info" size="sm" className="ms-2">
              {t('roles.system', 'نظام')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: t('roles.description', 'الوصف'),
      hideOnMobile: true,
      render: (role) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {role.description || '-'}
        </span>
      ),
    },
    {
      key: 'permissions',
      header: t('roles.permissions', 'الصلاحيات'),
      render: (role) => (
        <button
          onClick={() => setViewingRole(role)}
          className="flex items-center gap-2 hover:underline"
          style={{ color: 'var(--color-primary-600)' }}
        >
          <span className="font-semibold">{role.permissions?.length || 0}</span>
          <span className="text-sm">{t('roles.permissions_label', 'صلاحيات')}</span>
        </button>
      ),
    },
    {
      key: 'users_count',
      header: t('roles.users', 'المستخدمون'),
      align: 'center',
      hideOnMobile: true,
      width: '100px',
      render: (role) => (
        <Badge variant="default">{role.users_count || 0}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: t('roles.created', 'تاريخ الإنشاء'),
      hideOnMobile: true,
      render: (role) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {role.created_at ? new Date(role.created_at).toLocaleDateString(locale) : '-'}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions = (role: Role) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => setViewingRole(role)}
        className="btn btn-ghost p-2"
        title={t('common.view', 'عرض')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      {canEdit && !role.is_system && (
        <button
          onClick={() => {
            setEditingRole(role);
            setShowForm(true);
          }}
          className="btn btn-ghost p-2"
          title={t('common.edit', 'تعديل')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {canDelete && !role.is_system && (
        <button
          onClick={() => setDeletingRole(role)}
          className="btn btn-ghost p-2"
          style={{ color: 'var(--color-error-600)' }}
          title={t('common.delete', 'حذف')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.roles', 'الأدوار')}
        </h1>
        {canCreate && (
          <button
            onClick={() => {
              setEditingRole(null);
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('roles.add', 'إضافة دور')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('roles.search_placeholder', 'ابحث عن الأدوار...')}
        />
      </div>

      {/* Roles Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={roles}
          keyExtractor={(role) => role.id}
          isLoading={isLoading}
          emptyIcon="🛡️"
          emptyTitle={t('roles.empty', 'لم يتم العثور على أدوار')}
          emptyDescription={t('roles.empty_desc', 'قم بإنشاء دور جديد للبدء')}
          rowActions={canEdit || canDelete ? rowActions : undefined}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        role={editingRole}
        permissions={permissions}
        onSuccess={() => {
          setShowForm(false);
          loadRoles();
        }}
      />

      {/* View Permissions Modal */}
      <Modal
        isOpen={viewingRole !== null}
        onClose={() => setViewingRole(null)}
        title={viewingRole?.name || ''}
        size="lg"
      >
        {viewingRole && (
          <PermissionsView
            permissions={viewingRole.permissions || []}
            allPermissions={permissions}
            t={t}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingRole !== null}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDelete}
        title={t('roles.delete_role', 'حذف الدور')}
        message={t('roles.delete_confirm', 'هل أنت متأكد من رغبتك في حذف هذا الدور؟ سيفقد المستخدمون الذين لديهم هذا الدور صلاحياتهم.')}
        confirmLabel={t('common.delete', 'حذف')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

// Role Form Modal Component
interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  permissions: Permission[];
  onSuccess: () => void;
}

function RoleFormModal({ isOpen, onClose, role, permissions, onSuccess }: RoleFormModalProps) {
  const { t } = useLocaleStore();
  const isEdit = role !== null;

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permission_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const groupedPermissions = groupPermissions(permissions);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData({
          name: role.name,
          description: role.description || '',
          permission_ids: role.permissions?.map((p) => p.id) || [],
        });
      } else {
        setFormData({
          name: '',
          description: '',
          permission_ids: [],
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, role]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.required', 'هذا الحقل مطلوب');
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
      if (isEdit && role) {
        await rolesApi.update(role.id, {
          name: formData.name,
          description: formData.description,
          permission_ids: formData.permission_ids,
        });
        toast.success(t('roles.updated', 'تم تحديث الدور بنجاح'));
      } else {
        await rolesApi.create({
          name: formData.name,
          description: formData.description,
          permission_ids: formData.permission_ids,
        });
        toast.success(t('roles.created', 'تم إنشاء الدور بنجاح'));
      }
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('error.save_failed', 'فشل في الحفظ')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId],
    }));
  };

  const handleModuleToggle = (modulePermissions: Permission[]) => {
    const allSelected = modulePermissions.every((p) =>
      formData.permission_ids.includes(p.id)
    );
    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permission_ids: prev.permission_ids.filter(
          (id) => !modulePermissions.some((p) => p.id === id)
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permission_ids: [
          ...prev.permission_ids,
          ...modulePermissions.map((p) => p.id).filter((id) => !prev.permission_ids.includes(id)),
        ],
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('roles.edit_role', 'تعديل الدور') : t('roles.add_role', 'إضافة دور')}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {submitError && <FormError message={submitError} />}

        <div className="grid grid-cols-1 gap-4">
          <FormField
            label={t('roles.name', 'الاسم')}
            required
            error={errors.name}
          >
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder={t('roles.name_placeholder', 'مثلاً: أمين المبيعات')}
            />
          </FormField>

          <FormField label={t('roles.description', 'الوصف')}>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
              placeholder={t('roles.description_placeholder', 'وصف موجز لهذا الدور')}
            />
          </FormField>

          {/* Permissions */}
          <FormField label={t('roles.permissions', 'الصلاحيات')}>
            <div
              className="max-h-80 overflow-y-auto rounded-lg border p-4 space-y-4"
              style={{ borderColor: 'var(--color-gray-200)' }}
            >
              {Array.from(groupedPermissions.entries()).map(([module, modulePerms]) => (
                <div key={module}>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={modulePerms.every((p) => formData.permission_ids.includes(p.id))}
                      onChange={() => handleModuleToggle(modulePerms)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--color-primary-600)' }}
                    />
                    <span className="font-semibold" style={{ color: 'var(--color-gray-900)' }}>
                      {translateModuleName(module, t)}
                    </span>
                    <Badge variant="default" size="sm">
                      {modulePerms.filter((p) => formData.permission_ids.includes(p.id)).length}/
                      {modulePerms.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ms-6">
                    {modulePerms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permission_ids.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: 'var(--color-primary-600)' }}
                        />
                        <span style={{ color: 'var(--color-gray-700)' }}>
                          {translatePermissionAction(perm.name.split('.')[1], t)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FormField>
        </div>

        <FormActions
          onCancel={onClose}
          isSubmitting={isLoading}
          submitLabel={isEdit ? t('common.save', 'حفظ') : t('roles.create', 'إنشاء دور')}
        />
      </form>
    </Modal>
  );
}

// Permissions View Component
interface PermissionsViewProps {
  permissions: Permission[];
  allPermissions: Permission[];
  t: (key: string, fallback: string) => string;
}

function PermissionsView({ permissions, allPermissions, t }: PermissionsViewProps) {
  const permissionIds = new Set(permissions.map((p) => p.id));
  const groupedAll = groupPermissions(allPermissions);

  return (
    <div className="space-y-4">
      {Array.from(groupedAll.entries()).map(([module, modulePerms]) => {
        const grantedCount = modulePerms.filter((p) => permissionIds.has(p.id)).length;
        if (grantedCount === 0) return null;

        return (
          <div key={module} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold" style={{ color: 'var(--color-gray-900)' }}>
                {translateModuleName(module, t)}
              </span>
              <Badge variant="primary" size="sm">
                {grantedCount}/{modulePerms.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {modulePerms.map((perm) => (
                <Badge
                  key={perm.id}
                  variant={permissionIds.has(perm.id) ? 'success' : 'default'}
                  size="sm"
                >
                  {permissionIds.has(perm.id) ? '✓ ' : ''}
                  {translatePermissionAction(perm.name.split('.')[1], t)}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
      {permissions.length === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--color-gray-500)' }}>
          {t('roles.no_permissions', 'لم تتم إسناد أي صلاحيات')}
        </div>
      )}
    </div>
  );
}

export default RolesPage;
