/**
 * Purchases Page - Purchase Invoices Management
 * 
 * This page manages Purchase Invoices (NOT Purchase Orders).
 * Purchase Invoices represent actual supplier invoices that:
 * - Immediately increase inventory stock on creation
 * - Track payment status (unpaid, partial, paid)
 * - Record costs for financial reporting
 * 
 * There is NO purchase order workflow (draft → send → receive).
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import { usePermissions } from '../hooks/usePermissions';
import {
  DataTable,
  SearchInput,
  Badge,
  Select,
} from '../components/ui';
import {
  InvoiceCreateModal,
  InvoiceDetailModal,
  SupplierReturnModal,
} from '../components/purchases';
import { purchasesApi, suppliersApi } from '../lib/apiClient';
import type { PurchaseInvoice, PurchaseInvoiceListParams, PaymentStatus, Supplier } from '../types';
import type { Column } from '../components/ui';

export function PurchasesPage() {
  const { t, locale } = useLocaleStore();
  const { hasPermission } = usePermissions();

  // Permissions
  const canCreate = hasPermission('purchases.create') || hasPermission('purchases.manage');
  const canReturn = hasPermission('purchases.return') || hasPermission('purchases.manage');

  // State
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 15,
  });

  // Suppliers for filter
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<number | ''>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Format currency for LYD
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  }, [locale]);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PurchaseInvoiceListParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: search || undefined,
        payment_status: (paymentStatusFilter as PaymentStatus) || undefined,
        supplier_id: supplierFilter || undefined,
      };

      const response = await purchasesApi.list(params);
      setInvoices(response.data);
      setPagination((prev) => ({
        ...prev,
        currentPage: response.meta.current_page,
        totalPages: response.meta.last_page,
        totalItems: response.meta.total,
      }));
    } catch {
      toast.error(t('error.load_failed', 'Failed to load purchase invoices'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search, paymentStatusFilter, supplierFilter, t]);

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      const data = await suppliersApi.listAll();
      setSuppliers(data);
    } catch {
      // Silently fail
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [search, paymentStatusFilter, supplierFilter]);

  // Payment status badge
  const getPaymentBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'warning' | 'success'> = {
      unpaid: 'default',
      partial: 'warning',
      paid: 'success',
    };
    const labels: Record<PaymentStatus, string> = {
      unpaid: t('purchases.unpaid', 'Unpaid'),
      partial: t('purchases.partial_paid', 'Partial'),
      paid: t('purchases.paid', 'Paid'),
    };
    return <Badge variant={variants[status]} dot>{labels[status]}</Badge>;
  };

  // Table columns
  const columns: Column<PurchaseInvoice>[] = [
    {
      key: 'invoice_number',
      header: t('purchases.invoice_number', 'Invoice #'),
      width: '140px',
      render: (invoice) => (
        <button
          onClick={() => setDetailInvoiceId(invoice.id)}
          className="font-mono text-sm hover:underline"
          style={{ color: 'var(--color-primary-600)' }}
        >
          {invoice.invoice_number}
        </button>
      ),
    },
    {
      key: 'supplier',
      header: t('purchases.supplier', 'Supplier'),
      render: (invoice) => (
        <span style={{ color: 'var(--color-gray-900)' }}>
          {invoice.supplier?.name || '-'}
        </span>
      ),
    },
    {
      key: 'supplier_invoice',
      header: t('purchases.supplier_invoice', 'Supplier Inv #'),
      hideOnMobile: true,
      render: (invoice) => (
        <span className="font-mono text-sm" style={{ color: 'var(--color-gray-600)' }}>
          {invoice.supplier_invoice_number || '-'}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('purchases.total', 'Total'),
      align: 'end',
      render: (invoice) => (
        <span className="font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {formatCurrency(invoice.total)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: t('purchases.payment', 'Payment'),
      align: 'center',
      width: '110px',
      render: (invoice) => getPaymentBadge(invoice.payment_status),
    },
    {
      key: 'invoice_date',
      header: t('purchases.date', 'Date'),
      hideOnMobile: true,
      render: (invoice) => (
        <span style={{ color: 'var(--color-gray-600)' }}>
          {new Date(invoice.invoice_date).toLocaleDateString(locale)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: '80px',
      render: (invoice) => {
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setDetailInvoiceId(invoice.id)}
              className="p-2 rounded-lg hover:bg-gray-100"
              title={t('common.view', 'View')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        );
      },
    },
  ];

  // Payment status filter options
  const paymentOptions = [
    { value: '', label: t('common.all_status', 'All Status') },
    { value: 'unpaid', label: t('purchases.unpaid', 'Unpaid') },
    { value: 'partial', label: t('purchases.partial_paid', 'Partial') },
    { value: 'paid', label: t('purchases.paid', 'Paid') },
  ];

  // Supplier filter options
  const supplierOptions = [
    { value: '', label: t('common.all_suppliers', 'All Suppliers') },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  // Calculate stats from loaded data
  const stats = {
    unpaid: invoices.filter((i) => i.payment_status === 'unpaid').length,
    partial: invoices.filter((i) => i.payment_status === 'partial').length,
    paid: invoices.filter((i) => i.payment_status === 'paid').length,
    total: invoices.reduce((sum, i) => sum + Number(i.total), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
            {t('nav.purchases', 'Purchase Invoices')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-gray-500)' }}>
            {t('purchases.description', 'Record supplier invoices to increase inventory')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              {t('purchases.return', 'Return to Supplier')}
            </button>
          )}
          {canCreate && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('purchases.record_purchase', 'Record Purchase')}
            </button>
          )}
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
              placeholder={t('purchases.search_placeholder', 'Search by invoice # or supplier...')}
            />
          </div>

          {/* Payment status filter */}
          <div style={{ minWidth: '150px' }}>
            <Select
              value={paymentStatusFilter}
              onChange={(val) => setPaymentStatusFilter(val as string)}
              options={paymentOptions}
            />
          </div>

          {/* Supplier filter */}
          <div style={{ minWidth: '180px' }}>
            <Select
              value={supplierFilter}
              onChange={(val) => setSupplierFilter(val as number | '')}
              options={supplierOptions}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-gray-600)' }}>
            {stats.unpaid}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('purchases.unpaid', 'Unpaid')}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-warning-600)' }}>
            {stats.partial}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('purchases.partial_paid', 'Partial')}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-success-600)' }}>
            {stats.paid}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('purchases.paid', 'Paid')}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>
            {formatCurrency(stats.total)}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('purchases.page_total', 'Page Total')}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div 
        className="p-4 rounded-lg border flex items-start gap-3"
        style={{ 
          backgroundColor: 'var(--color-info-50)', 
          borderColor: 'var(--color-info-200)' 
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm" style={{ color: 'var(--color-info-800)' }}>
          <strong>{t('purchases.stock_note_title', 'Automatic Stock Updates:')}</strong>{' '}
          {t('purchases.stock_note', 'When you record a purchase invoice, inventory quantities are increased immediately.')}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={invoices}
          keyExtractor={(invoice) => invoice.id}
          isLoading={isLoading}
          emptyIcon="🧾"
          emptyTitle={t('purchases.empty', 'No purchase invoices found')}
          emptyDescription={t('purchases.empty_desc', 'Record your first purchase to add stock to inventory')}
          pagination={{
            ...pagination,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, currentPage: page })),
          }}
        />
      </div>

      {/* Create Modal */}
      <InvoiceCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadInvoices();
        }}
      />

      {/* Detail Modal */}
      <InvoiceDetailModal
        isOpen={detailInvoiceId !== null}
        onClose={() => setDetailInvoiceId(null)}
        invoiceId={detailInvoiceId}
        onPaymentRecorded={() => {
          loadInvoices();
        }}
      />

      {/* Supplier Return Modal */}
      <SupplierReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSuccess={() => {
          setShowReturnModal(false);
          loadInvoices();
        }}
      />
    </div>
  );
}

export default PurchasesPage;
