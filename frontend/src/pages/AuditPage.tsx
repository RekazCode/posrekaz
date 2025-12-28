/**
 * Audit Log Page - Full implementation
 * System activity tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import {
  DataTable,
  SearchInput,
  DateRangePicker,
  Badge,
  Modal,
} from '../components/ui';
import type { DateRange, Column } from '../components/ui';
import { auditApi } from '../lib/apiClient';
import type { AuditLog, AuditLogParams, AuditAction } from '../types';

// Action type to badge variant mapping
const actionVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  create: 'success',
  update: 'warning',
  delete: 'danger',
  login: 'info',
  logout: 'default',
  view: 'default',
};

export function AuditPage() {
  const { t, locale } = useLocaleStore();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 25,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Load audit logs
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: AuditLogParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
        action: (actionFilter as AuditAction) || undefined,
        entity_type: entityFilter || undefined,
        date_from: dateRange.start?.toISOString().split('T')[0] || undefined,
        date_to: dateRange.end?.toISOString().split('T')[0] || undefined,
      };

      const response = await auditApi.list(params);
      setLogs(response.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'Failed to load audit logs'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, dateRange, actionFilter, entityFilter, t]);

  // Initial load
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, dateRange, actionFilter, entityFilter]);

  // Table columns
  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: t('audit.timestamp', 'Timestamp'),
      width: '180px',
      render: (log) => (
        <span className="text-sm" style={{ color: 'var(--color-gray-600)' }}>
          {new Date(log.created_at).toLocaleString(locale)}
        </span>
      ),
    },
    {
      key: 'user',
      header: t('audit.user', 'User'),
      render: (log) => (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            {log.user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span style={{ color: 'var(--color-gray-900)' }}>
            {log.user?.name || t('audit.system', 'System')}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: t('audit.action', 'Action'),
      width: '100px',
      render: (log) => (
        <Badge variant={actionVariants[log.action] || 'default'}>
          {log.action.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'entity_type',
      header: t('audit.entity', 'Entity'),
      hideOnMobile: true,
      render: (log) => (
        <span style={{ color: 'var(--color-gray-700)' }}>
          {log.entity_type}
          {log.entity_id && (
            <span className="text-sm ms-1" style={{ color: 'var(--color-gray-500)' }}>
              #{log.entity_id}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('audit.description', 'Description'),
      hideOnMobile: true,
      render: (log) => (
        <span className="text-sm truncate max-w-xs" style={{ color: 'var(--color-gray-600)' }}>
          {log.description || '-'}
        </span>
      ),
    },
    {
      key: 'ip_address',
      header: t('audit.ip', 'IP'),
      hideOnMobile: true,
      width: '120px',
      render: (log) => (
        <span className="font-mono text-sm" style={{ color: 'var(--color-gray-500)' }}>
          {log.ip_address || '-'}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions = (log: AuditLog) => (
    <button
      onClick={() => setSelectedLog(log)}
      className="btn btn-ghost p-2"
      title={t('common.view', 'View Details')}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </button>
  );

  // Filter options
  const actionOptions = [
    { value: '', label: t('common.all_actions', 'All Actions') },
    { value: 'create', label: t('audit.create', 'Create') },
    { value: 'update', label: t('audit.update', 'Update') },
    { value: 'delete', label: t('audit.delete', 'Delete') },
    { value: 'login', label: t('audit.login', 'Login') },
    { value: 'logout', label: t('audit.logout', 'Logout') },
  ];

  const entityOptions = [
    { value: '', label: t('common.all_entities', 'All Entities') },
    { value: 'Product', label: t('audit.product', 'Product') },
    { value: 'Sale', label: t('audit.sale', 'Sale') },
    { value: 'User', label: t('audit.user', 'User') },
    { value: 'Role', label: t('audit.role', 'Role') },
    { value: 'Inventory', label: t('audit.inventory', 'Inventory') },
    { value: 'Category', label: t('audit.category', 'Category') },
    { value: 'Setting', label: t('audit.setting', 'Setting') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.audit', 'Audit Log')}
        </h1>
        <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
          {pagination.totalItems} {t('common.records', 'records')}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('audit.search_placeholder', 'Search by user, description...')}
            />
          </div>

          {/* Date range */}
          <div className="w-full lg:w-80">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', minWidth: '130px' }}
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Entity filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', minWidth: '130px' }}
          >
            {entityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          isLoading={isLoading}
          emptyIcon="📋"
          emptyTitle={t('audit.empty', 'No audit logs found')}
          emptyDescription={t('audit.empty_desc', 'System activities will appear here')}
          rowActions={rowActions}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title={t('audit.details', 'Audit Log Details')}
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>{t('audit.timestamp', 'Timestamp')}:</span>
                <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {new Date(selectedLog.created_at).toLocaleString(locale)}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>{t('audit.user', 'User')}:</span>
                <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {selectedLog.user?.name || t('audit.system', 'System')}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>{t('audit.action', 'Action')}:</span>
                <div>
                  <Badge variant={actionVariants[selectedLog.action] || 'default'}>
                    {selectedLog.action.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>{t('audit.entity', 'Entity')}:</span>
                <div className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {selectedLog.entity_type} #{selectedLog.entity_id}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>{t('audit.ip', 'IP Address')}:</span>
                <div className="font-mono" style={{ color: 'var(--color-gray-900)' }}>
                  {selectedLog.ip_address || '-'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-gray-500)' }}>{t('audit.user_agent', 'User Agent')}:</span>
                <div className="text-xs truncate" style={{ color: 'var(--color-gray-600)' }}>
                  {selectedLog.user_agent || '-'}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedLog.description && (
              <div>
                <span className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                  {t('audit.description', 'Description')}:
                </span>
                <p className="mt-1 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-gray-50)', color: 'var(--color-gray-700)' }}>
                  {selectedLog.description}
                </p>
              </div>
            )}

            {/* Old/New Values */}
            {(selectedLog.old_values || selectedLog.new_values) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLog.old_values && (
                  <div>
                    <span className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {t('audit.old_values', 'Previous Values')}:
                    </span>
                    <pre
                      className="mt-1 p-3 rounded-lg text-xs overflow-auto"
                      style={{ backgroundColor: 'var(--color-error-50)', color: 'var(--color-gray-700)', maxHeight: '200px' }}
                    >
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.new_values && (
                  <div>
                    <span className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {t('audit.new_values', 'New Values')}:
                    </span>
                    <pre
                      className="mt-1 p-3 rounded-lg text-xs overflow-auto"
                      style={{ backgroundColor: 'var(--color-success-50)', color: 'var(--color-gray-700)', maxHeight: '200px' }}
                    >
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AuditPage;
