import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, addWeeks, addMonths, addYears } from 'date-fns';

interface RevenueDataPoint {
  period: string;
  revenue: number;
  formattedRevenue: string;
  date: Date;
  bar: number;
  door: number;
  attendance: number;
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
  attendance: {
    label: "Attendance",
    color: "#3B82F6", // Blue color for attendance line
  },
};

export const RevenueTimeChart = () => {
  const [timeScale, setTimeScale] = useState<TimeScale>('weekly');
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [venues, setVenues] = useState<string[]>([]);

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeScale, selectedVenue]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('square_locations')
        .select('location_name')
        .eq('is_active', true)
        .order('location_name');

      if (error) {
        console.error('Error fetching venues:', error);
        return;
      }

      const locationNames = data?.map(row => row.location_name) || [];
      setVenues(locationNames);
    } catch (error) {
      console.error('Error:', error);
    }
  };



  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      
      let revenueData: RevenueDataPoint[] = [];
      const venueFilter = selectedVenue === 'all' ? null : selectedVenue;

      switch (timeScale) {
        case 'weekly':
          revenueData = await fetchWeeklyRevenue(venueFilter);
          break;
        case 'monthly':
          revenueData = await fetchMonthlyRevenue(venueFilter);
          break;
        case 'yearly':
          revenueData = await fetchYearlyRevenue(venueFilter);
          break;
      }

      setData(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyRevenue = async (venueFilter: string | null): Promise<RevenueDataPoint[]> => {
    // Fetch revenue data
    const { data: revenueData, error: revenueError } = await supabase.rpc('get_weekly_revenue_summary', {
      venue_filter: venueFilter,
      week_date: null
    });

    if (revenueError) {
      console.error('Error fetching weekly revenue data:', revenueError);
      return [];
    }

    // Fetch attendance data (Hippie Door transactions)
    const { data: attendanceData, error: attendanceError } = await supabase.rpc('get_weekly_revenue_summary', {
      venue_filter: 'Hippie Door',
      week_date: null
    });

    if (attendanceError) {
      console.error('Error fetching weekly attendance data:', attendanceError);
    }

    // Create a map of attendance by week
    const attendanceMap = new Map();
    (attendanceData || []).forEach((row) => {
      attendanceMap.set(row.week_start, row.door_transactions || 0);
    });

    // Take the last 12 weeks
    const weeklyData = revenueData?.slice(0, 12) || [];
    
    return weeklyData.map((row) => {
      const weekStart = new Date(row.week_start);
      return {
        period: format(weekStart, 'MMM dd'),
        revenue: row.total_revenue_cents / 100,
        formattedRevenue: formatCurrency(row.total_revenue_cents / 100),
        date: weekStart,
        bar: row.bar_revenue_cents / 100,
        door: row.door_revenue_cents / 100,
        attendance: attendanceMap.get(row.week_start) || 0
      };
    }).reverse(); // Reverse to show oldest to newest
  };

  const fetchMonthlyRevenue = async (venueFilter: string | null): Promise<RevenueDataPoint[]> => {
    // Fetch revenue data
    const { data: revenueData, error: revenueError } = await supabase.rpc('get_monthly_revenue_summary', {
      venue_filter: venueFilter,
      month_date: null
    });

    if (revenueError) {
      console.error('Error fetching monthly revenue data:', revenueError);
      return [];
    }

    // Fetch attendance data (Hippie Door transactions)
    const { data: attendanceData, error: attendanceError } = await supabase.rpc('get_monthly_revenue_summary', {
      venue_filter: 'Hippie Door',
      month_date: null
    });

    if (attendanceError) {
      console.error('Error fetching monthly attendance data:', attendanceError);
    }

    // Create a map of attendance by month
    const attendanceMap = new Map();
    (attendanceData || []).forEach((row) => {
      attendanceMap.set(row.month, row.door_transactions || 0);
    });

    // Take the last 12 months
    const monthlyData = revenueData?.slice(0, 12) || [];
    
    return monthlyData.map((row) => {
      const monthStart = new Date(row.month);
      return {
        period: format(monthStart, 'MMM yyyy'),
        revenue: row.total_revenue_cents / 100,
        formattedRevenue: formatCurrency(row.total_revenue_cents / 100),
        date: monthStart,
        bar: row.bar_revenue_cents / 100,
        door: row.door_revenue_cents / 100,
        attendance: attendanceMap.get(row.month) || 0
      };
    }).reverse(); // Reverse to show oldest to newest
  };

  const fetchYearlyRevenue = async (venueFilter: string | null): Promise<RevenueDataPoint[]> => {
    // Fetch revenue data
    const { data: revenueData, error: revenueError } = await supabase.rpc('get_yearly_revenue_summary', {
      venue_filter: venueFilter,
      year_date: null
    });

    if (revenueError) {
      console.error('Error fetching yearly revenue data:', revenueError);
      return [];
    }

    // Fetch attendance data (Hippie Door transactions)
    const { data: attendanceData, error: attendanceError } = await supabase.rpc('get_yearly_revenue_summary', {
      venue_filter: 'Hippie Door',
      year_date: null
    });

    if (attendanceError) {
      console.error('Error fetching yearly attendance data:', attendanceError);
    }

    // Create a map of attendance by year
    const attendanceMap = new Map();
    (attendanceData || []).forEach((row) => {
      attendanceMap.set(row.year_start, row.door_transactions || 0);
    });

    // Take the last 5 years
    const yearlyData = revenueData?.slice(0, 5) || [];
    
    return yearlyData.map((row) => {
      const yearStart = new Date(row.year_start);
      return {
        period: format(yearStart, 'yyyy'),
        revenue: row.total_revenue_cents / 100,
        formattedRevenue: formatCurrency(row.total_revenue_cents / 100),
        date: yearStart,
        bar: row.bar_revenue_cents / 100,
        door: row.door_revenue_cents / 100,
        attendance: attendanceMap.get(row.year_start) || 0
      };
    }).reverse(); // Reverse to show oldest to newest
  };

  const formatCurrency = (value: number): string => {
    // Convert from GST inclusive to GST exclusive by dividing by 1.1
    const gstExclusiveAmount = value / 1.1;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(gstExclusiveAmount);
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Venue:</span>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues.map(venue => (
                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={timeScale} onValueChange={(value) => setTimeScale(value as TimeScale)}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-96 w-full">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="revenue"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <YAxis 
                yAxisId="attendance"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const revenueItems = payload.filter(item => item.name === 'bar' || item.name === 'door');
                    const attendanceItem = payload.find(item => item.name === 'attendance');
                    const totalRevenue = revenueItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                    
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{formatTooltipLabel(label)}</div>
                            <div className="text-sm font-bold">${totalRevenue.toLocaleString()}</div>
                          </div>
                          <div className="grid gap-1">
                            {revenueItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="h-2 w-2 rounded-full" 
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {item.name === 'bar' ? 'Bar' : 'Door'}
                                  </span>
                                </div>
                                <span className="text-xs font-medium">${(item.value || 0).toLocaleString()}</span>
                              </div>
                            ))}
                            {attendanceItem && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="h-2 w-2 rounded-full" 
                                    style={{ backgroundColor: attendanceItem.color }}
                                  />
                                  <span className="text-xs text-muted-foreground">Attendance</span>
                                </div>
                                <span className="text-xs font-medium">{(attendanceItem.value || 0).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                yAxisId="revenue"
                dataKey="bar"
                stackId="a"
                fill="hsl(var(--chart-1))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                yAxisId="revenue"
                dataKey="door"
                stackId="a"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 4, 4]}
              />
              <Line
                yAxisId="attendance"
                type="monotone"
                dataKey="attendance"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#3B82F6" }}
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
            </ComposedChart>
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