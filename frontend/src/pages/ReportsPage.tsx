/**
 * Reports Page - Full implementation
 * Sales, inventory, and cash register reports with charts and export
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore, toast } from '../stores';
import {
  DateRangePicker,
  Badge,
  LoadingSpinner,
} from '../components/ui';
import type { DateRange } from '../components/ui';
import { SalesLineChart, SalesPieChart, RevenueBarChart } from '../components/charts';
import { reportsApi, dashboardApi } from '../lib/apiClient';
import type { SalesReport, InventoryReport, CashRegisterReport, DashboardData } from '../types';

type ReportType = 'sales' | 'inventory' | 'cash';

export function ReportsPage() {
  const { t, locale } = useLocaleStore();

  // State
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [cashReport, setCashReport] = useState<CashRegisterReport | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Format currency for LYD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY').format(num);
  };

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const data = await dashboardApi.metrics();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, []);

  // Load sales report
  const loadSalesReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.sales({
        date_from: dateRange.start?.toISOString().split('T')[0] || undefined,
        date_to: dateRange.end?.toISOString().split('T')[0] || undefined,
      });
      setSalesReport(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load report'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, t]);

  // Load inventory report
  const loadInventoryReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.inventory();
      setInventoryReport(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load report'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load cash register report
  const loadCashReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportsApi.cashRegister({
        date_from: dateRange.start?.toISOString().split('T')[0] || undefined,
        date_to: dateRange.end?.toISOString().split('T')[0] || undefined,
      });
      setCashReport(data);
    } catch {
      toast.error(t('error.load_failed', 'Failed to load report'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, t]);

  // Export report
  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const exportType = activeTab === 'cash' ? 'cash-register' : activeTab;
      const blob = await reportsApi.export(exportType, {
        from: dateRange.start?.toISOString().split('T')[0],
        to: dateRange.end?.toISOString().split('T')[0],
      });
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(t('reports.exported', 'Report exported successfully'));
    } catch {
      toast.error(t('error.export_failed', 'Failed to export report'));
    } finally {
      setIsExporting(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load report based on active tab
  useEffect(() => {
    if (activeTab === 'sales') {
      loadSalesReport();
    } else if (activeTab === 'inventory') {
      loadInventoryReport();
    } else {
      loadCashReport();
    }
  }, [activeTab, loadSalesReport, loadInventoryReport, loadCashReport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
          {t('nav.reports', 'Reports')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title={t('dashboard.today_sales', "Today's Sales")}
            value={formatCurrency(dashboard.today?.revenue || 0)}
            icon="💰"
          />
          <SummaryCard
            title={t('dashboard.today_orders', "Today's Orders")}
            value={formatNumber(dashboard.today?.sales_count || 0)}
            icon="🧾"
          />
          <SummaryCard
            title={t('dashboard.low_stock', 'Low Stock Items')}
            value={formatNumber(dashboard.low_stock_alert || 0)}
            icon="⚠️"
            variant={dashboard.low_stock_alert > 0 ? 'warning' : 'default'}
          />
          <SummaryCard
            title={t('dashboard.pending_orders', 'Pending Orders')}
            value={formatNumber(dashboard.pending_orders || 0)}
            icon="👥"
          />
        </div>
      )}

      {/* Report Tabs */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('sales')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: activeTab === 'sales' ? 'var(--color-primary-600)' : 'var(--color-gray-100)',
                color: activeTab === 'sales' ? 'var(--color-white)' : 'var(--color-gray-700)',
              }}
            >
              <span className="me-2">📊</span>
              {t('reports.sales', 'Sales Report')}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: activeTab === 'inventory' ? 'var(--color-primary-600)' : 'var(--color-gray-100)',
                color: activeTab === 'inventory' ? 'var(--color-white)' : 'var(--color-gray-700)',
              }}
            >
              <span className="me-2">📦</span>
              {t('reports.inventory', 'Inventory Report')}
            </button>
            <button
              onClick={() => setActiveTab('cash')}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: activeTab === 'cash' ? 'var(--color-primary-600)' : 'var(--color-gray-100)',
                color: activeTab === 'cash' ? 'var(--color-white)' : 'var(--color-gray-700)',
              }}
            >
              <span className="me-2">💵</span>
              {t('reports.cash_register', 'Cash Register')}
            </button>
          </div>

          {/* Date Range (for sales and cash reports) */}
          {(activeTab === 'sales' || activeTab === 'cash') && (
            <div className="w-full sm:w-80">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          )}
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : activeTab === 'sales' ? (
          <SalesReportView report={salesReport} formatCurrency={formatCurrency} formatNumber={formatNumber} t={t} />
        ) : activeTab === 'inventory' ? (
          <InventoryReportView report={inventoryReport} formatCurrency={formatCurrency} formatNumber={formatNumber} t={t} />
        ) : (
          <CashReportView report={cashReport} formatCurrency={formatCurrency} formatNumber={formatNumber} t={t} />
        )}
      </div>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: number;
  variant?: 'default' | 'warning';
}

function SummaryCard({ title, value, icon, trend, variant = 'default' }: SummaryCardProps) {
  return (
    <div
      className="card flex items-center gap-4"
      style={{
        backgroundColor: variant === 'warning' ? 'var(--color-warning-50)' : undefined,
      }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
        style={{ backgroundColor: 'var(--color-gray-100)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
          {title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
            {value}
          </span>
          {trend !== undefined && trend !== 0 && (
            <Badge
              variant={trend > 0 ? 'success' : 'danger'}
              size="sm"
            >
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Sales Report View
interface SalesReportViewProps {
  report: SalesReport | null;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  t: (key: string, fallback: string) => string;
}

function SalesReportView({ report, formatCurrency, formatNumber, t }: SalesReportViewProps) {
  if (!report) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-gray-500)' }}>
        {t('reports.no_data', 'No data available')}
      </div>
    );
  }

  // Prepare chart data
  const salesByDateData = report.by_date || [];
  const categoryChartData = (report.by_category || report.sales_by_category || []).map((cat) => ({
    name: cat.name || cat.category_name || 'Unknown',
    value: cat.revenue || cat.total || 0,
  }));
  const paymentMethodChartData = (report.by_payment_method || []).map((pm) => ({
    name: pm.method,
    value: pm.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.total_sales', 'Total Sales')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>
            {formatCurrency(report.summary.total_revenue)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.total_orders', 'Total Orders')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-gray-900)' }}>
            {formatNumber(report.summary.total_sales)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.avg_order', 'Avg Order Value')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-gray-900)' }}>
            {formatCurrency(report.summary.average_sale)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.items_sold', 'Items Sold')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-gray-900)' }}>
            {formatNumber(report.summary.total_items_sold)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        {salesByDateData.length > 0 && (
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
              {t('reports.sales_trend', 'Sales Trend')}
            </h3>
            <SalesLineChart data={salesByDateData} height={250} />
          </div>
        )}

        {/* Sales by Category */}
        {categoryChartData.length > 0 && (
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
              {t('reports.sales_by_category', 'Sales by Category')}
            </h3>
            <SalesPieChart data={categoryChartData} height={250} />
          </div>
        )}
      </div>

      {/* Payment Methods Chart */}
      {paymentMethodChartData.length > 0 && (
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.by_payment_method', 'By Payment Method')}
          </h3>
          <RevenueBarChart data={paymentMethodChartData} height={200} horizontal />
        </div>
      )}

      {/* Top Products */}
      {report.top_products && report.top_products.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.top_products', 'Top Products')}
          </h3>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>#</th>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('products.name', 'Product')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('reports.quantity_sold', 'Qty Sold')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('reports.revenue', 'Revenue')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-gray-100)' }}>
                {report.top_products.map((product, index) => (
                  <tr key={product.product_id}>
                    <td className="px-4 py-2" style={{ color: 'var(--color-gray-500)' }}>
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-gray-900)' }}>
                      {product.product_name}
                    </td>
                    <td className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                      {formatNumber(product.quantity_sold)}
                    </td>
                    <td className="px-4 py-2 text-end font-medium" style={{ color: 'var(--color-primary-600)' }}>
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales by Category */}
      {report.sales_by_category && report.sales_by_category.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.sales_by_category', 'Sales by Category')}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {report.sales_by_category.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-lg border"
                style={{ borderColor: 'var(--color-gray-200)' }}
              >
                <p className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {cat.name}
                </p>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-primary-600)' }}>
                  {formatCurrency(cat.total ?? cat.revenue ?? 0)}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
                  {cat.percentage ?? 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Inventory Report View
interface InventoryReportViewProps {
  report: InventoryReport | null;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  t: (key: string, fallback: string) => string;
}

function InventoryReportView({ report, formatCurrency, formatNumber, t }: InventoryReportViewProps) {
  if (!report) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-gray-500)' }}>
        {t('reports.no_data', 'No data available')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.total_products', 'Total Products')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-gray-900)' }}>
            {formatNumber(report.total_products ?? report.summary?.total_products ?? 0)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-gray-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.total_stock_value', 'Total Stock Value')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>
            {formatCurrency(report.total_stock_value ?? report.summary?.total_stock_value ?? 0)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.low_stock', 'Low Stock')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-warning-600)' }}>
            {formatNumber(report.low_stock_count ?? report.summary?.low_stock_count ?? 0)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-error-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.out_of_stock', 'Out of Stock')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-error-600)' }}>
            {formatNumber(report.out_of_stock_count ?? report.summary?.out_of_stock_count ?? 0)}
          </p>
        </div>
      </div>

      {/* Low Stock Items */}
      {report.low_stock_items && report.low_stock_items.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.low_stock_items', 'Low Stock Items')}
          </h3>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('products.sku', 'SKU')}
                  </th>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('products.name', 'Product')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('inventory.current', 'Current')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('inventory.min_level', 'Min Level')}
                  </th>
                  <th className="px-4 py-2 text-center" style={{ color: 'var(--color-gray-600)' }}>
                    {t('inventory.status', 'Status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-gray-100)' }}>
                {report.low_stock_items.map((item) => (
                  <tr key={item.id ?? item.product_id}>
                    <td className="px-4 py-2 font-mono text-sm" style={{ color: 'var(--color-gray-500)' }}>
                      {item.sku}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-gray-900)' }}>
                      {item.name ?? item.product_name}
                    </td>
                    <td className="px-4 py-2 text-end font-semibold" style={{ color: 'var(--color-error-600)' }}>
                      {formatNumber(item.quantity ?? item.current_quantity ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                      {formatNumber(item.min_stock_level)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant={(item.quantity ?? item.current_quantity ?? 0) === 0 ? 'danger' : 'warning'} dot>
                        {(item.quantity ?? item.current_quantity ?? 0) === 0 ? t('inventory.out_of_stock', 'Out') : t('inventory.low', 'Low')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock by Category */}
      {report.stock_by_category && report.stock_by_category.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.stock_by_category', 'Stock by Category')}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {report.stock_by_category.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-lg border"
                style={{ borderColor: 'var(--color-gray-200)' }}
              >
                <p className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
                  {cat.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-gray-600)' }}>
                  {formatNumber(cat.products_count)} {t('reports.products', 'products')}
                </p>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-primary-600)' }}>
                  {formatCurrency(cat.stock_value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Cash Register Report View
interface CashReportViewProps {
  report: CashRegisterReport | null;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  t: (key: string, fallback: string) => string;
}

function CashReportView({ report, formatCurrency, formatNumber, t }: CashReportViewProps) {
  if (!report) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-gray-500)' }}>
        {t('reports.no_data', 'No data available')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.cash_in', 'Cash In')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-success-600)' }}>
            {formatCurrency(report.summary.total_cash_in)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-error-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.cash_out', 'Cash Out')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-error-600)' }}>
            {formatCurrency(report.summary.total_cash_out)}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.net_cash', 'Net Cash')}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>
            {formatCurrency(report.summary.net_cash)}
          </p>
        </div>
      </div>

      {/* Balance Info */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.opening_balance', 'Opening Balance')}
          </p>
          <p className="text-xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
            {formatCurrency(report.summary.opening_balance)}
          </p>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.closing_balance', 'Closing Balance')}
          </p>
          <p className="text-xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
            {formatCurrency(report.summary.closing_balance)}
          </p>
        </div>
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-gray-200)' }}>
          <p className="text-sm" style={{ color: 'var(--color-gray-500)' }}>
            {t('reports.transactions', 'Transactions')}
          </p>
          <p className="text-xl font-semibold" style={{ color: 'var(--color-gray-900)' }}>
            {formatNumber(report.summary.transactions_count)}
          </p>
        </div>
      </div>

      {/* By User */}
      {report.by_user && report.by_user.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.by_user', 'Cash by User')}
          </h3>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('users.name', 'User')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('reports.cash_in', 'Cash In')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('reports.cash_out', 'Cash Out')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('reports.transactions', 'Transactions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-gray-100)' }}>
                {report.by_user.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-gray-900)' }}>
                      {user.user_name}
                    </td>
                    <td className="px-4 py-2 text-end" style={{ color: 'var(--color-success-600)' }}>
                      {formatCurrency(user.cash_in)}
                    </td>
                    <td className="px-4 py-2 text-end" style={{ color: 'var(--color-error-600)' }}>
                      {formatCurrency(user.cash_out)}
                    </td>
                    <td className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                      {formatNumber(user.transactions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {report.transactions && report.transactions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--color-gray-900)' }}>
            {t('reports.recent_transactions', 'Recent Transactions')}
          </h3>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-gray-200)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('common.type', 'Type')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('common.amount', 'Amount')}
                  </th>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('common.reference', 'Reference')}
                  </th>
                  <th className="px-4 py-2 text-start" style={{ color: 'var(--color-gray-600)' }}>
                    {t('users.name', 'User')}
                  </th>
                  <th className="px-4 py-2 text-end" style={{ color: 'var(--color-gray-600)' }}>
                    {t('common.time', 'Time')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-gray-100)' }}>
                {report.transactions.slice(0, 20).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          tx.type === 'sale' ? 'success' :
                          tx.type === 'refund' ? 'warning' :
                          tx.type === 'expense' ? 'danger' : 'info'
                        }
                      >
                        {tx.type}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-2 text-end font-semibold"
                      style={{
                        color: tx.type === 'sale' || tx.type === 'adjustment'
                          ? 'var(--color-success-600)'
                          : 'var(--color-error-600)'
                      }}
                    >
                      {tx.type === 'sale' || tx.type === 'adjustment' ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-gray-600)' }}>
                      {tx.reference || '-'}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-gray-900)' }}>
                      {tx.user_name}
                    </td>
                    <td className="px-4 py-2 text-end text-xs" style={{ color: 'var(--color-gray-500)' }}>
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
