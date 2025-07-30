import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, addWeeks, addMonths, addYears } from 'date-fns';

interface RevenueDataPoint {
  period: string;
  revenue: number;
  formattedRevenue: string;
  date: Date;
  bar: number;
  door: number;
  other: number;
}

type TimeScale = 'weekly' | 'monthly' | 'yearly';

const chartConfig = {
  revenue: {
    label: "Total Revenue",
    color: "hsl(var(--chart-1))",
  },
  bar: {
    label: "Bar Revenue",
    color: "hsl(var(--chart-1))",
  },
  door: {
    label: "Door Revenue", 
    color: "hsl(var(--chart-2))",
  },
  other: {
    label: "Other Revenue",
    color: "hsl(var(--chart-3))",
  },
};

export const RevenueTimeChart = () => {
  const [timeScale, setTimeScale] = useState<TimeScale>('weekly');
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [timeScale]);

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      
      let revenueData: RevenueDataPoint[] = [];

      switch (timeScale) {
        case 'weekly':
          revenueData = await fetchWeeklyRevenue();
          break;
        case 'monthly':
          revenueData = await fetchMonthlyRevenue();
          break;
        case 'yearly':
          revenueData = await fetchYearlyRevenue();
          break;
      }

      setData(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyRevenue = async (): Promise<RevenueDataPoint[]> => {
    const { data, error } = await supabase.rpc('get_weekly_revenue_summary', {
      venue_filter: null,
      week_date: null
    });

    if (error) {
      console.error('Error fetching weekly revenue data:', error);
      return [];
    }

    // Take the last 12 weeks
    const weeklyData = data?.slice(0, 12) || [];
    
    return weeklyData.map((row) => {
      const weekStart = new Date(row.week_start);
      return {
        period: format(weekStart, 'MMM dd'),
        revenue: row.total_revenue_cents / 100,
        formattedRevenue: formatCurrency(row.total_revenue_cents / 100),
        date: weekStart,
        bar: row.bar_revenue_cents / 100,
        door: row.door_revenue_cents / 100,
        other: 0 // No other revenue type in current schema
      };
    }).reverse(); // Reverse to show oldest to newest
  };

  const fetchMonthlyRevenue = async (): Promise<RevenueDataPoint[]> => {
    const { data, error } = await supabase.rpc('get_monthly_revenue_summary', {
      venue_filter: null,
      month_date: null
    });

    if (error) {
      console.error('Error fetching monthly revenue data:', error);
      return [];
    }

    // Take the last 12 months
    const monthlyData = data?.slice(0, 12) || [];
    
    return monthlyData.map((row) => {
      const monthStart = new Date(row.month);
      return {
        period: format(monthStart, 'MMM yyyy'),
        revenue: row.total_revenue_cents / 100,
        formattedRevenue: formatCurrency(row.total_revenue_cents / 100),
        date: monthStart,
        bar: row.bar_revenue_cents / 100,
        door: row.door_revenue_cents / 100,
        other: 0 // No other revenue type in current schema
      };
    }).reverse(); // Reverse to show oldest to newest
  };

  const fetchYearlyRevenue = async (): Promise<RevenueDataPoint[]> => {
    const { data, error } = await supabase.rpc('get_yearly_revenue_summary', {
      venue_filter: null,
      year_date: null
    });

    if (error) {
      console.error('Error fetching yearly revenue data:', error);
      return [];
    }

    // Take the last 5 years
    const yearlyData = data?.slice(0, 5) || [];
    
    return yearlyData.map((row) => {
      const yearStart = new Date(row.year_start);
      return {
        period: format(yearStart, 'yyyy'),
        revenue: row.total_revenue_cents / 100,
        formattedRevenue: formatCurrency(row.total_revenue_cents / 100),
        date: yearStart,
        bar: row.bar_revenue_cents / 100,
        door: row.door_revenue_cents / 100,
        other: 0 // No other revenue type in current schema
      };
    }).reverse(); // Reverse to show oldest to newest
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  const formatTooltipLabel = (label: string) => {
    return label;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading revenue data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Chart</CardTitle>
          <Tabs value={timeScale} onValueChange={(value) => setTimeScale(value as TimeScale)}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-96 w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const totalRevenue = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{formatTooltipLabel(label)}</div>
                            <div className="text-sm font-bold">${totalRevenue.toLocaleString()}</div>
                          </div>
                          <div className="grid gap-1">
                            {payload.map((item, index) => (
                              <div key={index} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="h-2 w-2 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {item.name === 'bar' ? 'Bar' : item.name === 'door' ? 'Door' : 'Other'}
                                  </span>
                                </div>
                                <span className="text-xs font-medium">${(item.value || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="bar"
                stackId="a"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="door"
                stackId="a"
                fill="hsl(var(--chart-2))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="other"
                stackId="a"
                fill="hsl(var(--chart-3))"
                radius={[0, 0, 4, 4]}
              />
              <ChartLegend
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <ChartLegendContent
                      payload={payload}
                      className="mt-4"
                    />
                  );
                }}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500">No revenue data available</p>
              <p className="text-sm text-gray-400">Try syncing and transforming some payment data</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 