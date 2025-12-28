/**
 * Trend Sparkline component
 * Small inline chart for showing trends in cards
 */

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TrendSparklineProps {
  data: number[];
  height?: number;
  width?: number;
  color?: string;
  strokeWidth?: number;
}

export function TrendSparkline({
  data,
  height = 40,
  width = 100,
  color = 'var(--color-primary-500)',
  strokeWidth = 2,
}: TrendSparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Transform array to chart data
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  // Determine trend color
  const trend = data.length >= 2 ? data[data.length - 1] - data[0] : 0;
  const trendColor = trend >= 0 ? 'var(--color-success-500)' : 'var(--color-error-500)';

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color === 'auto' ? trendColor : color}
          strokeWidth={strokeWidth}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TrendSparkline;
