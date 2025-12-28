import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocaleStore } from '../../stores';
import { Pagination } from './Pagination';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    onPageChange: (page: number) => void;
  };
  // Sorting
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Selection
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  // Actions
  rowActions?: (item: T) => ReactNode;
  // Mobile card rendering
  mobileCardRender?: (item: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyIcon = '📋',
  emptyTitle,
  emptyDescription,
  emptyAction,
  pagination,
  sortKey,
  sortDirection,
  onSort,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  rowActions,
  mobileCardRender,
}: DataTableProps<T>) {
  const { t, direction } = useLocaleStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useMemo(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedKeys.size === data.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map(keyExtractor)));
    }
  };

  // Handle single row select
  const handleSelect = (key: string | number) => {
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    onSelectionChange?.(newSelection);
  };

  // Sort indicator
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message={t('common.loading', 'Loading...')} />
      </div>
    );
  }

  // Empty state
  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle || t('table.no_data', 'No data found')}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  // Mobile card view
  if (isMobile && mobileCardRender) {
    return (
      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="card p-4"
          >
            {mobileCardRender(item)}
          </div>
        ))}
        {pagination && <Pagination {...pagination} />}
      </div>
    );
  }

  // Visible columns on mobile
  const visibleColumns = isMobile
    ? columns.filter((col) => !col.hideOnMobile)
    : columns;

  return (
    <div>
      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
        >
          <LoadingSpinner />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto relative" role="region" aria-label={t('table.data_region', 'Data table')}>
        <table 
          className="w-full" 
          dir={direction}
          role="table"
          aria-rowcount={data.length}
        >
          <thead role="rowgroup">
            <tr style={{ backgroundColor: 'var(--color-gray-50)' }} role="row">
              {/* Select all checkbox */}
              {selectable && (
                <th className="px-4 py-3 w-12" role="columnheader" scope="col">
                  <input
                    type="checkbox"
                    checked={selectedKeys.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--color-primary-600)' }}
                  />
                </th>
              )}

              {/* Column headers */}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-${column.align || 'start'} font-medium text-sm`}
                  style={{
                    color: 'var(--color-gray-600)',
                    width: column.width,
                    cursor: column.sortable ? 'pointer' : 'default',
                  }}
                  onClick={() => column.sortable && onSort?.(column.key)}
                  role="columnheader"
                  scope="col"
                  aria-sort={sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortable && <SortIcon columnKey={column.key} />}
                  </span>
                </th>
              ))}

              {/* Actions column */}
              {rowActions && (
                <th
                  className="px-4 py-3 text-end font-medium text-sm w-24"
                  style={{ color: 'var(--color-gray-600)' }}
                  role="columnheader"
                  scope="col"
                >
                  {t('table.actions', 'Actions')}
                </th>
              )}
            </tr>
          </thead>

          <tbody role="rowgroup">
            {data.map((item, index) => {
              const key = keyExtractor(item);
              return (
                <tr
                  key={key}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid var(--color-gray-100)',
                    backgroundColor: selectedKeys.has(key)
                      ? 'var(--color-primary-50)'
                      : index % 2 === 0
                      ? 'white'
                      : 'var(--color-gray-50)',
                  }}
                  role="row"
                  aria-rowindex={index + 2}
                  aria-selected={selectable ? selectedKeys.has(key) : undefined}
                >
                  {/* Row checkbox */}
                  {selectable && (
                    <td className="px-4 py-3" role="cell">
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(key)}
                        onChange={() => handleSelect(key)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--color-primary-600)' }}
                        aria-label={t('table.select_row', 'Select row')}
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-${column.align || 'start'}`}
                      style={{ color: 'var(--color-gray-900)' }}
                      role="cell"
                    >
                      {column.render
                        ? column.render(item)
                        : (item as Record<string, unknown>)[column.key]?.toString()}
                    </td>
                  ))}

                  {/* Row actions */}
                  {rowActions && (
                    <td className="px-4 py-3 text-end" role="cell">
                      {rowActions(item)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
