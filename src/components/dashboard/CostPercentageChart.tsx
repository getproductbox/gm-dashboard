
import { WeeklyFinancials } from "@/services/financialService";
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

  const chartData = data.map(item => {
    // If revenue is very low (< $100), percentage calculations blow up. 
    // Filter out weeks with negligible revenue to avoid chart spikes, 
    // or clamp the value? 
    // For now, let's just calculate raw %, but maybe cap visually?
    const revenue = item.revenue > 100 ? item.revenue : 1; 
    
    // If revenue is basically 0, these will be 0 (if item.wages is normal) / 1 * 100 = huge.
    // If revenue is 0, maybe we should return 0 percentages or null?
    if (item.revenue <= 100) {
      return {
        date: format(parseISO(item.weekStart), "MMM d"),
        wages: 0,
        cogs: 0,
        security: 0,
        other: 0,
        revenueTooLow: true
      };
    }

    return {
      date: format(parseISO(item.weekStart), "MMM d"),
      wages: (item.wages / revenue) * 100,
      cogs: (item.cogs / revenue) * 100,
      security: (item.security / revenue) * 100,
      other: (item.otherExpenses / revenue) * 100
    };
  });

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

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
              <YAxis 
                tickFormatter={(val) => `${val}%`} 
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  if (props.payload.revenueTooLow) return ['Low Revenue', name];
                  return [formatPercent(value), name];
                }}
                labelStyle={{ color: 'black' }}
                cursor={{ fill: 'transparent' }}
              />
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
