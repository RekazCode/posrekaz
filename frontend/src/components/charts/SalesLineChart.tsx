/**
 * Sales Line Chart component
 * Shows sales over time
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLocaleStore } from '../../stores';

interface SalesLineChartProps {
  data: Array<{
    date: string;
    revenue: number;
    sales_count?: number;
  }>;
  height?: number;
  showGrid?: boolean;
}

export function SalesLineChart({
  data,
  height = 300,
  showGrid = true,
}: SalesLineChartProps) {
  const { locale, t } = useLocaleStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height, color: 'var(--color-gray-400)' }}
      >
        {t('reports.no_data', 'No data available')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />}
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="var(--color-gray-500)"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value)}
          stroke="var(--color-gray-500)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), t('reports.revenue', 'Revenue')]}
          labelFormatter={formatDate}
          contentStyle={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray-200)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary-500)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-primary-500)', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: 'var(--color-primary-600)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SalesLineChart;
