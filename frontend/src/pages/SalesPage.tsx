/**
 * Sales History Page - Full implementation
 * View sales history, details, refunds
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks';
import {
  DataTable,
  SearchInput,
  DateRangePicker,
  Badge,
  Modal,
  ConfirmDialog,
  LoadingSpinner,
} from '../components/ui';
import type { DateRange } from '../components/ui';
import { salesApi } from '../lib/apiClient';
import type { Sale, SaleWithItems, SaleListParams, SaleStatus } from '../types';
import type { Column } from '../components/ui';

export function SalesPage() {
  const { t, locale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canVoid = hasPermission('sales.void');

  // State
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Detail modal
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Void confirmation
  const [voidingSale, setVoidingSale] = useState<Sale | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Format currency for LYD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Page Summary
  const pageSummary = useMemo(() => {
    const totalAmount = sales.reduce((sum, sale) => sum + (sale.total_amount ?? sale.grand_total), 0);
    const totalCount = sales.length;
    const avgSale = totalCount > 0 ? totalAmount / totalCount : 0;
    
    return { totalAmount, totalCount, avgSale };
  }, [sales]);

  // Load sales
  const loadSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: SaleListParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
        status: (statusFilter || undefined) as SaleStatus | undefined,
        date_from: dateRange.start?.toISOString().split('T')[0] || undefined,
        date_to: dateRange.end?.toISOString().split('T')[0] || undefined,
      };

      const response = await salesApi.list(params);
      setSales(response.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'Failed to load sales'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, dateRange, statusFilter, t]);

  // Load sale detail
  const loadSaleDetail = async (id: number) => {
    setIsLoadingDetail(true);
    try {
      const sale = await salesApi.get(id);
      setSelectedSale(sale);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load sale details'));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Void sale
  const handleVoid = async () => {
    if (!voidingSale) return;

    setIsVoiding(true);
    try {
      await salesApi.void(voidingSale.id, 'Voided by user');
      toast.success(t('sales.voided', 'Sale voided successfully'));
      setVoidingSale(null);
      loadSales();
    } catch {
      toast.error(t('error.void_failed', 'Failed to void sale'));
    } finally {
      setIsVoiding(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, dateRange, statusFilter]);

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" dot>{t('sales.completed', 'Completed')}</Badge>;
      case 'refunded':
        return <Badge variant="warning" dot>{t('sales.refunded', 'Refunded')}</Badge>;
      case 'voided':
        return <Badge variant="danger" dot>{t('sales.voided', 'Voided')}</Badge>;
      case 'pending':
        return <Badge variant="info" dot>{t('sales.pending', 'Pending')}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // Table columns
  const columns: Column<Sale>[] = [
    {
      key: 'receipt_number',
      header: t('sales.receipt', 'Receipt #'),
      width: '140px',
      render: (sale) => (
        <button
          onClick={() => loadSaleDetail(sale.id)}
          className="flex items-center gap-2 font-mono text-sm hover:text-primary-700 transition-colors group"
          style={{ color: 'var(--color-primary-600)' }}
        >
          <svg className="w-4 h-4 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {sale.receipt_number}
        </button>
      ),
    },
    {
      key: 'created_at',
      header: t('sales.date', 'Date'),
      sortable: true,
      render: (sale) => {
        const date = new Date(sale.created_at);
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
              {date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
              {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'customer',
      header: t('sales.customer', 'Customer'),
      hideOnMobile: true,
      render: (sale) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
            {(sale.customer?.name || '?').charAt(0).toUpperCase()}
          </div>
          <span style={{ color: 'var(--color-gray-700)' }}>
            {sale.customer?.name || <span className="italic text-gray-400">{t('sales.walk_in', 'Walk-in')}</span>}
          </span>
        </div>
      ),
    },
    {
      key: 'items_count',
      header: t('sales.items', 'Items'),
      align: 'center',
      hideOnMobile: true,
      width: '80px',
      render: (sale) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-600">
          {sale.items_count ?? '-'}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: t('sales.total', 'Total'),
      align: 'end',
      sortable: true,
      render: (sale) => (
        <span 
          className={`font-bold ${sale.status === 'void' || sale.status === 'voided' ? 'line-through text-gray-400' : 'text-gray-900'}`}
        >
          {formatCurrency(sale.total_amount ?? sale.grand_total)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('sales.status', 'Status'),
      align: 'center',
      width: '120px',
      render: (sale) => getStatusBadge(sale.status),
    },
    {
      key: 'cashier',
      header: t('sales.cashier', 'Cashier'),
      hideOnMobile: true,
      render: (sale) => (
        <span className="text-sm" style={{ color: 'var(--color-gray-600)' }}>
          {sale.user?.name}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions = (sale: Sale) => {
    if (sale.status !== 'completed') return null;

    return (
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => loadSaleDetail(sale.id)}
          className="btn btn-ghost p-2"
          title={t('common.view', 'View')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        {canVoid && (
          <button
            onClick={() => setVoidingSale(sale)}
            className="btn btn-ghost p-2"
            style={{ color: 'var(--color-error-600)' }}
            title={t('sales.void', 'Void')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  // Status filter options
  const statusOptions = [
    { value: '', label: t('common.all_statuses', 'All Statuses') },
    { value: 'completed', label: t('sales.completed', 'Completed') },
    { value: 'refunded', label: t('sales.refunded', 'Refunded') },
    { value: 'voided', label: t('sales.voided', 'Voided') },
    { value: 'pending', label: t('sales.pending', 'Pending') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-gray-900)' }}>
            {t('nav.sales', 'Sales History')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-gray-500)' }}>
            {t('sales.subtitle', 'Manage and view your sales transactions')}
          </p>
        </div>
        <div className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100" style={{ color: 'var(--color-gray-600)' }}>
          {pagination.totalItems} {t('common.records', 'records')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4" style={{ borderLeftColor: 'var(--color-primary-500)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-gray-500)' }}>{t('sales.page_total', 'Page Total')}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-gray-900)' }}>{formatCurrency(pageSummary.totalAmount)}</p>
            </div>
            <div className="p-3 rounded-full bg-primary-50 text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4" style={{ borderLeftColor: 'var(--color-secondary-500)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-gray-500)' }}>{t('sales.transactions', 'Transactions')}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-gray-900)' }}>{pageSummary.totalCount}</p>
            </div>
            <div className="p-3 rounded-full bg-secondary-50 text-secondary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4" style={{ borderLeftColor: 'var(--color-success-500)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-gray-500)' }}>{t('sales.avg_value', 'Avg. Value')}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-gray-900)' }}>{formatCurrency(pageSummary.avgSale)}</p>
            </div>
            <div className="p-3 rounded-full bg-success-50 text-success-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
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
              placeholder={t('sales.search_placeholder', 'Search by receipt # or customer...')}
            />
          </div>

          {/* Date range */}
          <div className="w-full lg:w-80">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

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

      {/* Sales Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={sales}
          keyExtractor={(sale) => sale.id}
          isLoading={isLoading}
          emptyIcon="🧾"
          emptyTitle={t('sales.empty', 'No sales found')}
          emptyDescription={t('sales.empty_desc', 'Sales will appear here after transactions')}
          rowActions={rowActions}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={selectedSale !== null || isLoadingDetail}
        onClose={() => setSelectedSale(null)}
        title={selectedSale ? `${t('sales.receipt', 'Receipt')} #${selectedSale.receipt_number}` : t('common.loading', 'Loading...')}
        size="lg"
      >
        {isLoadingDetail ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : selectedSale ? (
          <SaleDetail sale={selectedSale} formatCurrency={formatCurrency} t={t} />
        ) : null}
      </Modal>

      {/* Void Confirmation */}
      <ConfirmDialog
        isOpen={voidingSale !== null}
        onClose={() => setVoidingSale(null)}
        onConfirm={handleVoid}
        title={t('sales.void_sale', 'Void Sale')}
        message={t('sales.void_confirm', 'Are you sure you want to void this sale? This action cannot be undone.')}
        confirmLabel={t('sales.void', 'Void')}
        variant="danger"
        isLoading={isVoiding}
      />
    </div>
  );
}

// Sale Detail Component
interface SaleDetailProps {
  sale: SaleWithItems;
  formatCurrency: (amount: number) => string;
  t: (key: string, fallback: string) => string;
}

function SaleDetail({ sale, formatCurrency, t }: SaleDetailProps) {
  return (
    <div className="space-y-6">
      {/* Receipt Header Info */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{t('sales.receipt', 'Receipt')}:</span>
              <span className="font-mono font-medium text-gray-900">{sale.receipt_number}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{t('sales.date', 'Date')}:</span>
              <span className="text-gray-900">{new Date(sale.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{t('sales.cashier', 'Cashier')}:</span>
              <span className="text-gray-900">{sale.user?.name}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{t('sales.customer', 'Customer')}:</span>
              <span className="font-medium text-gray-900">{sale.customer?.name || t('sales.walk_in', 'Walk-in')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{t('sales.status', 'Status')}:</span>
              <Badge
                variant={
                  sale.status === 'completed'
                    ? 'success'
                    : sale.status === 'void' || sale.status === 'voided'
                    ? 'danger'
                    : 'warning'
                }
              >
                {sale.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {t('sales.items', 'Items')}
        </h4>
        <div className="border rounded-lg overflow-hidden border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-gray-600">
                  {t('products.name', 'Product')}
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">
                  {t('sales.qty', 'Qty')}
                </th>
                <th className="px-4 py-3 text-end font-medium text-gray-600 w-32">
                  {t('sales.price', 'Price')}
                </th>
                <th className="px-4 py-3 text-end font-medium text-gray-600 w-32">
                  {t('sales.subtotal', 'Total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sale.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900">
                    <div className="font-medium">{item.product?.name || item.product_name}</div>
                    {(item.discount ?? 0) > 0 && (
                      <div className="text-xs text-warning-600 mt-0.5">
                        Discount: {item.discount}%
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-end text-gray-600">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-end font-medium text-gray-900">
                    {formatCurrency(item.subtotal ?? item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Payments Section */}
        <div className="flex-1">
          <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t('sales.payments', 'Payments')}
          </h4>
          <div className="space-y-2">
            {sale.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-gray-100 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{payment.payment_method?.name || 'Unknown'}</div>
                    {payment.reference && (
                      <div className="text-xs text-gray-500">Ref: {payment.reference}</div>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="w-full sm:w-72">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('sales.subtotal', 'Subtotal')}</span>
              <span className="font-medium text-gray-900">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('sales.discount', 'Discount')}
                  {sale.discount_percent ? ` (${sale.discount_percent}%)` : ''}
                </span>
                <span className="text-error-600 font-medium">-{formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-3 mt-1">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-900">{t('sales.total', 'Total')}</span>
                <span className="font-bold text-xl text-primary-600">{formatCurrency(sale.total_amount ?? sale.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={() => window.print()}
          className="btn btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t('common.print', 'Print Receipt')}
        </button>
      </div>
    </div>
  );
}

export default SalesPage;
