/**
 * Sales Pie Chart component
 * Shows sales distribution by category or payment method
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLocaleStore } from '../../stores';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface SalesPieChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

// Color palette for chart
const COLORS = [
  'var(--color-primary-500)',
  'var(--color-success-500)',
  'var(--color-warning-500)',
  'var(--color-error-500)',
  'var(--color-info-500)',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
];

export function SalesPieChart({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}: SalesPieChartProps) {
  const { locale, t } = useLocaleStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 0,
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

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({ percent }: { percent?: number }) => {
    if (!percent || percent < 0.05) return null; // Don't show label if less than 5%
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data.map(d => ({ ...d, [d.name]: d.value }))}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel as ((props: object) => string | null)}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${formatCurrency(value as number)} (${(((value as number) / total) * 100).toFixed(1)}%)`,
            name as string,
          ]}
          contentStyle={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-gray-200)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span style={{ color: 'var(--color-gray-700)', fontSize: '12px' }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

export default SalesPieChart;
