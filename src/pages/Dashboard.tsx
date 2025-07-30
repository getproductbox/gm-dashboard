
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { RevenueTimeChart } from "@/components/revenue/RevenueTimeChart";

interface RevenueMetrics {
  current: number;
  previous: number;
  previousYear: number;
  currentFormatted: string;
  previousFormatted: string;
  previousYearFormatted: string;
  changePercent: number;
  changePercentYear: number;
}

interface DashboardData {
  weekly: RevenueMetrics;
  monthly: RevenueMetrics;
  yearly: RevenueMetrics;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      
      // Get current date ranges using PostgreSQL-compatible calculations
      const now = new Date();
      
      // For weekly: Get the current week (Monday to Sunday)
      const currentWeekStart = getWeekStart(now);
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      
      // For monthly: Get the current month (1st to last day)
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // For yearly: Get the current year (Jan 1 to Dec 31)
      const currentYearStart = new Date(now.getFullYear(), 0, 1);
      const currentYearEnd = new Date(now.getFullYear(), 11, 31);
      
      // Get previous periods
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(currentWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
      
      const previousMonthStart = new Date(currentMonthStart);
      previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
      const previousMonthEnd = new Date(currentMonthStart);
      previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);
      
      const previousYearStart = new Date(currentYearStart);
      previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
      const previousYearEnd = new Date(currentYearEnd);
      previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);
      
      // Get same period last year
      const lastYearWeekStart = new Date(currentWeekStart);
      lastYearWeekStart.setFullYear(lastYearWeekStart.getFullYear() - 1);
      const lastYearWeekEnd = new Date(currentWeekEnd);
      lastYearWeekEnd.setFullYear(lastYearWeekEnd.getFullYear() - 1);
      
      const lastYearMonthStart = new Date(currentMonthStart);
      lastYearMonthStart.setFullYear(lastYearMonthStart.getFullYear() - 1);
      const lastYearMonthEnd = new Date(currentMonthEnd);
      lastYearMonthEnd.setFullYear(lastYearMonthEnd.getFullYear() - 1);
      
      const lastYearYearStart = new Date(currentYearStart);
      lastYearYearStart.setFullYear(lastYearYearStart.getFullYear() - 1);
      const lastYearYearEnd = new Date(currentYearEnd);
      lastYearYearEnd.setFullYear(lastYearYearEnd.getFullYear() - 1);

      // Fetch revenue data for all periods using database functions
      const [weeklyData, monthlyData, yearlyData] = await Promise.all([
        fetchPeriodRevenue(currentWeekStart, currentWeekEnd, previousWeekStart, previousWeekEnd, lastYearWeekStart, lastYearWeekEnd, 'weekly'),
        fetchPeriodRevenue(currentMonthStart, currentMonthEnd, previousMonthStart, previousMonthEnd, lastYearMonthStart, lastYearMonthEnd, 'monthly'),
        fetchPeriodRevenue(currentYearStart, currentYearEnd, previousYearStart, previousYearEnd, lastYearYearStart, lastYearYearEnd, 'yearly')
      ]);

      setDashboardData({
        weekly: weeklyData,
        monthly: monthlyData,
        yearly: yearlyData
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeriodRevenue = async (
    currentStart: Date, 
    currentEnd: Date, 
    previousStart: Date, 
    previousEnd: Date,
    previousYearStart: Date,
    previousYearEnd: Date,
    periodType: 'weekly' | 'monthly' | 'yearly'
  ): Promise<RevenueMetrics> => {
    const [currentRevenue, previousRevenue, previousYearRevenue] = await Promise.all([
      getRevenueForPeriod(currentStart, currentEnd, periodType),
      getRevenueForPeriod(previousStart, previousEnd, periodType),
      getRevenueForPeriod(previousYearStart, previousYearEnd, periodType)
    ]);

    const changePercent = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const changePercentYear = previousYearRevenue > 0 ? ((currentRevenue - previousYearRevenue) / previousYearRevenue) * 100 : 0;

    return {
      current: currentRevenue,
      previous: previousRevenue,
      previousYear: previousYearRevenue,
      currentFormatted: formatCurrency(currentRevenue),
      previousFormatted: formatCurrency(previousRevenue),
      previousYearFormatted: formatCurrency(previousYearRevenue),
      changePercent,
      changePercentYear
    };
  };

  const getRevenueForPeriod = async (startDate: Date, endDate: Date, periodType: 'weekly' | 'monthly' | 'yearly'): Promise<number> => {
    try {
      let data;
      let error;

      switch (periodType) {
        case 'weekly': {
          // For weekly periods, we need to get the specific week data
          const weekStart = new Date(startDate);
          weekStart.setHours(0, 0, 0, 0);
          ({ data, error } = await supabase.rpc('get_weekly_revenue_summary', {
            venue_filter: null,
            week_date: weekStart.toISOString()
          }));
          break;
        }
        case 'monthly': {
          // For monthly periods, we need to get the specific month data
          const monthStart = new Date(startDate);
          monthStart.setHours(0, 0, 0, 0);
          ({ data, error } = await supabase.rpc('get_monthly_revenue_summary', {
            venue_filter: null,
            month_date: monthStart.toISOString()
          }));
          break;
        }
        case 'yearly': {
          // For yearly periods, we need to get the specific year data
          const yearStart = new Date(startDate);
          yearStart.setHours(0, 0, 0, 0);
          ({ data, error } = await supabase.rpc('get_yearly_revenue_summary', {
            venue_filter: null,
            year_date: yearStart.toISOString()
          }));
          break;
        }
      }

      if (error) {
        console.error('Error fetching revenue:', error);
        return 0;
      }

      // If no data found for the specific period, return 0
      if (!data || data.length === 0) {
        return 0;
      }

      // Return the total revenue for the period in cents (no division by 100 here)
      return data[0].total_revenue_cents || 0;
    } catch (error) {
      console.error('Error in getRevenueForPeriod:', error);
      return 0;
    }
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  const formatPercent = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getTrendIcon = (percent: number) => {
    return percent >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (percent: number) => {
    return percent >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleViewRevenue = () => {
    navigate('/revenue');
  };

  const headerActions = (
    <Button onClick={handleViewRevenue} variant="outline">
      <BarChart3 className="h-4 w-4 mr-2" />
      View Detailed Revenue
    </Button>
  );

  if (isLoading) {
    return (
      <DashboardLayout headerActions={headerActions}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gm-neutral-900">Revenue Dashboard</h1>
            <p className="text-gm-neutral-600">Track your revenue performance across different time periods.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout headerActions={headerActions}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">Revenue Dashboard</h1>
          <p className="text-gm-neutral-600">Track your revenue performance across different time periods.</p>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.weekly.currentFormatted}</div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                {getTrendIcon(dashboardData?.weekly.changePercent || 0)}
                <span className={getTrendColor(dashboardData?.weekly.changePercent || 0)}>
                  {formatPercent(dashboardData?.weekly.changePercent || 0)} vs last week
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <div>Last week: {dashboardData?.weekly.previousFormatted}</div>
                <div>This week last year: {dashboardData?.weekly.previousYearFormatted}</div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.monthly.currentFormatted}</div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                {getTrendIcon(dashboardData?.monthly.changePercent || 0)}
                <span className={getTrendColor(dashboardData?.monthly.changePercent || 0)}>
                  {formatPercent(dashboardData?.monthly.changePercent || 0)} vs last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <div>Last month: {dashboardData?.monthly.previousFormatted}</div>
                <div>This month last year: {dashboardData?.monthly.previousYearFormatted}</div>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yearly</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.yearly.currentFormatted}</div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                {getTrendIcon(dashboardData?.yearly.changePercent || 0)}
                <span className={getTrendColor(dashboardData?.yearly.changePercent || 0)}>
                  {formatPercent(dashboardData?.yearly.changePercent || 0)} vs last year
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                <div>Last year: {dashboardData?.yearly.previousFormatted}</div>
                <div>Previous year: {dashboardData?.yearly.previousYearFormatted}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <div className="col-span-full">
          <RevenueTimeChart />
        </div>
      </div>
    </DashboardLayout>
  );
}
