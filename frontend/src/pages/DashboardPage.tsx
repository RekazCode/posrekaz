/**
 * Dashboard Page - Modern UI/UX Redesign
 * Phase F7: Reports & Analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useLocaleStore } from '../stores';
import { LoadingSpinner } from '../components/ui';
import { SalesLineChart, SalesPieChart, TrendSparkline } from '../components/charts';
import { dashboardApi, reportsApi } from '../lib/apiClient';
import type { DashboardData, SalesReport } from '../types';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  RefreshCw, 
  Store, 
  Package, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { t, locale } = useLocaleStore();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentDate] = useState(new Date());

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
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load dashboard metrics first (required)
      const dashboardData = await dashboardApi.metrics();
      setDashboard(dashboardData);

      // Try to load sales report (optional - may fail if no data)
      try {
        const salesData = await reportsApi.sales({
          date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0],
        });
        setSalesReport(salesData);
      } catch (salesErr) {
        console.warn('Sales report unavailable:', salesErr);
        setSalesReport(null);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      if (err.response?.status === 401) {
        setError(t('error.session_expired', 'Session expired. Please login again.'));
      } else {
        setError(t('error.load_failed', 'Failed to load data'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // Auto-refresh every 5 mins
    return () => clearInterval(interval);
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500 animate-pulse">{t('common.loading', 'Loading dashboard...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error.error_occurred', 'Something went wrong')}</h3>
        <p className="text-gray-500 mb-6 max-w-md">{error}</p>
        <button onClick={loadData} className="btn btn-primary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  // Prepare chart data
  const salesChartData = salesReport?.by_date || [];
  const categoryChartData = (salesReport?.by_category || salesReport?.sales_by_category || []).map((cat) => ({
    name: cat.name || cat.category_name || 'Unknown',
    value: cat.revenue || cat.total || 0,
  }));
  const paymentMethodData = (salesReport?.by_payment_method || []).map((pm) => ({
    name: pm.method,
    value: pm.amount,
  }));

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('dashboard.welcome', 'Welcome back')}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {currentDate.toLocaleDateString(locale === 'ar' ? 'ar-LY' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pos" className="btn btn-primary shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Store className="w-4 h-4" />
            {t('nav.pos', 'Open POS')}
          </Link>
          <button 
            onClick={loadData} 
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title={t('dashboard.today_sales', "Today's Sales")}
          value={formatCurrency(dashboard?.today?.revenue || 0)}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={dashboard?.trends?.revenue_7_days}
          trendLabel={t('dashboard.vs_last_week', 'vs last week')}
        />
        <KPICard
          title={t('dashboard.today_orders', "Today's Orders")}
          value={formatNumber(dashboard?.today?.sales_count || dashboard?.today_orders || 0)}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={dashboard?.trends?.sales_7_days}
        />
        <KPICard
          title={t('dashboard.new_customers', 'New Customers')}
          value={formatNumber(dashboard?.today?.new_customers || 0)}
          icon={<Users className="w-6 h-6 text-white" />}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          subValue={`${t('dashboard.active_users', 'Active Users')}: ${dashboard?.active_users || 0}`}
        />
        <KPICard
          title={t('dashboard.low_stock', 'Low Stock Items')}
          value={formatNumber(dashboard?.low_stock_alert || dashboard?.low_stock_count || 0)}
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          variant={(dashboard?.low_stock_alert || 0) > 0 ? 'warning' : 'default'}
          link="/inventory"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('dashboard.sales_trend', 'Sales Overview')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                +12.5%
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <SalesLineChart data={salesChartData} height={300} />
          </div>
        </div>

        {/* Sales by Category - Takes up 1 column */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('dashboard.sales_by_category', 'Category Share')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Revenue distribution</p>
          <div className="h-[300px] flex items-center justify-center">
            <SalesPieChart data={categoryChartData} height={280} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products Table */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              {t('dashboard.top_products', 'Top Selling Products')}
            </h3>
            <Link to="/reports" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t('common.view_all', 'View All')}
            </Link>
          </div>
          
          {salesReport?.top_products && salesReport.top_products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium">
                  <tr>
                    <th className="px-6 py-3 text-start">#</th>
                    <th className="px-6 py-3 text-start">{t('products.name', 'Product')}</th>
                    <th className="px-6 py-3 text-end">{t('reports.quantity_sold', 'Sold')}</th>
                    <th className="px-6 py-3 text-end">{t('reports.revenue', 'Revenue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {salesReport.top_products.slice(0, 5).map((product, index) => (
                    <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 w-12">0{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{product.product_name}</div>
                      </td>
                      <td className="px-6 py-4 text-end text-gray-600 dark:text-gray-400">
                        {formatNumber(product.quantity_sold)}
                      </td>
                      <td className="px-6 py-4 text-end font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t('reports.no_data', 'No sales data available yet')}</p>
            </div>
          )}
        </div>

        {/* Payment Methods Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            {t('dashboard.payment_methods', 'Payment Methods')}
          </h3>
          
          {paymentMethodData.length > 0 ? (
            <div className="space-y-4">
              {paymentMethodData.map((pm, idx) => {
                // Calculate percentage if total is available, otherwise just show value
                const total = paymentMethodData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = total > 0 ? Math.round((pm.value / total) * 100) : 0;
                
                return (
                  <div key={pm.name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{pm.name}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(pm.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-purple-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-end">{percent}%</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p>{t('reports.no_data', 'No payment data')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modern KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: number[];
  trendLabel?: string;
  subValue?: string;
  variant?: 'default' | 'warning';
  link?: string;
}

function KPICard({ title, value, icon, iconBg, trend, subValue, variant = 'default', link }: KPICardProps) {
  // Calculate trend percentage
  const trendPercent = trend && trend.length >= 2
    ? Math.round(((trend[trend.length - 1] - trend[0]) / (trend[0] || 1)) * 100)
    : null;

  const isPositive = trendPercent !== null && trendPercent >= 0;

  const CardContent = (
    <div className={cn(
      "bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md",
      variant === 'warning' 
        ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800" 
        : "border-gray-100 dark:border-zinc-800"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl shadow-sm", iconBg)}>
          {icon}
        </div>
        {trendPercent !== null && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            isPositive 
              ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
              : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trendPercent)}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        
        {subValue && (
          <p className="text-xs text-gray-400 mt-2">{subValue}</p>
        )}
        
        {trend && (
          <div className="mt-3 h-8 opacity-50">
             <TrendSparkline data={trend} color={isPositive ? '#10b981' : '#ef4444'} width={120} height={32} />
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{CardContent}</Link>;
  }

  return CardContent;
}

export default DashboardPage;
