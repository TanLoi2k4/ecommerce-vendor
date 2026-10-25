import { type ReactNode } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart';
import { formatChartDateLabel } from '../../utils/helpers';

type ChartType = 'line' | 'bar' | 'area' | 'pie';

interface ChartCardProps {
  title: string;
  subtitle?: ReactNode;
  type: ChartType;
  data: Record<string, unknown>[];
  dataKeys: { key: string; name: string; color: string }[];
  xAxisKey?: string;
  isLoading?: boolean;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  /** Color each bar by category (e.g. product) instead of one color per series. */
  colorByItem?: boolean;
  pieInnerRadius?: number;
  pieOuterRadius?: number;
  action?: ReactNode;
}

const COLORS = [
  '#f43f5e',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
  '#f97316',
];

/** Keep left gutter wide enough for compact ticks; card uses overflow-hidden. */
const CHART_MARGIN = { top: 8, right: 16, left: 8, bottom: 4 };

function formatYAxisTick(value: number): string {
  if (!Number.isFinite(value)) return '';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const compact = (n: number, suffix: string) =>
    `${sign}${Number(n.toFixed(1))}${suffix}`;
  if (abs >= 1_000_000_000) return compact(abs / 1_000_000_000, 'B');
  if (abs >= 1_000_000) return compact(abs / 1_000_000, 'M');
  if (abs >= 1_000) return compact(abs / 1_000, 'K');
  return String(value);
}

const axisTick = { fill: 'currentColor', className: 'text-gray-500', fontSize: 12 } as const;

function formatXAxisTick(value: unknown): string {
  const raw = typeof value === 'string' ? value : String(value ?? '');
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateMatch) {
    return `${dateMatch[3]}/${dateMatch[2]}`;
  }
  const label = formatChartDateLabel(value);
  if (label.length <= 14) return label;
  return `${label.slice(0, 13)}…`;
}

export function ChartCard({
  title,
  subtitle,
  type,
  data,
  dataKeys,
  xAxisKey = 'name',
  isLoading,
  height = 300,
  showGrid = true,
  showLegend = true,
  colorByItem = false,
  pieInnerRadius = 60,
  pieOuterRadius = 100,
  action,
}: ChartCardProps) {
  const CustomTooltip = ({ active, payload, label }: CategoricalChartProps['activePayload'] extends (infer T)[] ? { active: boolean; payload: T[]; label: string } : never) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">{formatChartDateLabel(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('vi-VN') : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-8 w-24" />
        </div>
        <div className="skeleton w-full rounded-lg" style={{ height }} />
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={CHART_MARGIN}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
              <XAxis
                dataKey={xAxisKey}
                className="text-xs"
                tick={axisTick}
                tickLine={false}
                tickFormatter={formatXAxisTick}
              />
              <YAxis
                className="text-xs"
                width={56}
                tick={axisTick}
                tickFormatter={formatYAxisTick}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={CustomTooltip as React.ComponentType<CategoricalChartProps>} />
              {showLegend && <Legend />}
              {dataKeys.map((dk, i) => (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.name}
                  stroke={dk.color || COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={CHART_MARGIN}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
              <XAxis
                dataKey={xAxisKey}
                className="text-xs"
                tick={axisTick}
                tickLine={false}
                tickFormatter={formatXAxisTick}
              />
              <YAxis
                className="text-xs"
                width={56}
                tick={axisTick}
                tickFormatter={formatYAxisTick}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={CustomTooltip as React.ComponentType<CategoricalChartProps>} />
              {showLegend && (
                <Legend
                  payload={
                    colorByItem
                      ? data.map((entry, index) => ({
                          id: String(entry[xAxisKey] ?? index),
                          value: formatXAxisTick(entry[xAxisKey]),
                          type: 'square' as const,
                          color: COLORS[index % COLORS.length],
                        }))
                      : undefined
                  }
                />
              )}
              {dataKeys.map((dk, i) => (
                <Bar
                  key={dk.key}
                  dataKey={dk.key}
                  name={dk.name}
                  fill={dk.color || COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                >
                  {colorByItem
                    ? data.map((_, index) => (
                        <Cell
                          key={`cell-${dk.key}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))
                    : null}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={CHART_MARGIN}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
              <XAxis
                dataKey={xAxisKey}
                className="text-xs"
                tick={axisTick}
                tickLine={false}
                tickFormatter={formatXAxisTick}
              />
              <YAxis
                className="text-xs"
                width={56}
                tick={axisTick}
                tickFormatter={formatYAxisTick}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={CustomTooltip as React.ComponentType<CategoricalChartProps>} />
              {showLegend && <Legend />}
              {dataKeys.map((dk, i) => (
                <Area
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.name}
                  stroke={dk.color || COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  fill={dk.color || COLORS[i % COLORS.length]}
                  fillOpacity={0.2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={pieInnerRadius}
                outerRadius={pieOuterRadius}
                paddingAngle={2}
                dataKey={dataKeys[0]?.key || 'value'}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={typeof entry.color === 'string' ? entry.color : COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={CustomTooltip as React.ComponentType<CategoricalChartProps>} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {subtitle != null && subtitle !== '' && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>
          )}
        </div>
        {action}
      </div>
      {renderChart()}
    </div>
  );
}
