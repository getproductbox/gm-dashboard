import { WeeklyFinancials, UncategorizedItem } from "@/services/financialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format, parseISO } from "date-fns";

interface CostPercentageChartProps {
  data: WeeklyFinancials[];
  isLoading: boolean;
}

interface ChartDataPoint {
  date: string;
  wages: number;
  cogs: number;
  security: number;
  other: number;
  revenueTooLow?: boolean;
  uncategorizedItems: UncategorizedItem[];
  revenue: number;
}

// Custom tooltip that shows "Other" breakdown on hover
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload as ChartDataPoint;
  if (!dataPoint) return null;

  if (dataPoint.revenueTooLow) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        <p className="text-sm text-gray-500">Revenue too low for accurate %</p>
      </div>
    );
  }

  // Top uncategorized items (sorted by amount descending)
  const topOtherItems = [...dataPoint.uncategorizedItems]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5);

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatCurrency = (val: number) => `$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs">
      <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
      
      <div className="space-y-1 text-sm">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name.replace(' %', '')}</span>
            <span className="font-medium">{formatPercent(entry.value)}</span>
          </div>
        ))}
      </div>

      {topOtherItems.length > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Top "Other" Items:
          </p>
          <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
            {topOtherItems.map((item, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="truncate">{item.name || 'Unknown'}</span>
                <span className="shrink-0">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {dataPoint.uncategorizedItems.length > 5 && (
              <p className="text-gray-400 italic">
                +{dataPoint.uncategorizedItems.length - 5} more items
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function CostPercentageChart({ data, isLoading }: CostPercentageChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost as % of Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartDataPoint[] = data.map(item => {
    // If revenue is very low (< $100), percentage calculations blow up
    if (item.revenue <= 100) {
      return {
        date: format(parseISO(item.weekStart), "MMM d"),
        wages: 0,
        cogs: 0,
        security: 0,
        other: 0,
        revenueTooLow: true,
        uncategorizedItems: item.uncategorizedItems || [],
        revenue: item.revenue
      };
    }

    const revenue = item.revenue;

    return {
      date: format(parseISO(item.weekStart), "MMM d"),
      wages: (item.wages / revenue) * 100,
      cogs: (item.cogs / revenue) * 100,
      security: (item.security / revenue) * 100,
      other: (item.otherExpenses / revenue) * 100,
      uncategorizedItems: item.uncategorizedItems || [],
      revenue: item.revenue
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost as % of Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(val) => `${val}%`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend />
              
              <Bar dataKey="wages" name="Wages %" stackId="a" fill="#f87171" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cogs" name="COGS %" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
              <Bar dataKey="security" name="Security %" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="other" name="Other %" stackId="a" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
