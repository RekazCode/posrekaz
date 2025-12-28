/**
 * Revenue Bar Chart component
 * Shows revenue comparison
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLocaleStore } from '../../stores';

interface RevenueBarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  height?: number;
  showGrid?: boolean;
  horizontal?: boolean;
}

export function RevenueBarChart({
  data,
  height = 300,
  showGrid = true,
  horizontal = false,
}: RevenueBarChartProps) {
  const { locale, t } = useLocaleStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />}
          <XAxis
            type="number"
            tickFormatter={(value) => formatCurrency(value)}
            stroke="var(--color-gray-500)"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--color-gray-500)"
            fontSize={12}
            width={70}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(value as number), t('reports.revenue', 'Revenue')]}
            contentStyle={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--color-primary-500)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />}
        <XAxis
          dataKey="name"
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
          contentStyle={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray-200)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Bar
          dataKey="value"
          fill="var(--color-primary-500)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RevenueBarChart;
