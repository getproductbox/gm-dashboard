
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, Users } from "lucide-react";
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
  // New metrics for attendance and spend per head
  currentAttendance: number;
  previousAttendance: number;
  previousYearAttendance: number;
  currentSpendPerHead: number;
  previousSpendPerHead: number;
  previousYearSpendPerHead: number;
  currentSpendPerHeadFormatted: string;
  previousSpendPerHeadFormatted: string;
  previousYearSpendPerHeadFormatted: string;
  attendanceChangePercent: number;
  attendanceChangePercentYear: number;
  spendPerHeadChangePercent: number;
  spendPerHeadChangePercentYear: number;
}

interface DashboardData {
  weekly: RevenueMetrics;
  monthly: RevenueMetrics;
  yearly: RevenueMetrics;
}

export default function Revenue() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [comparisonType, setComparisonType] = useState<'previous' | 'year'>('previous');




  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      
      // Dashboard stats always use ALL venues (no filtering)
      const venueFilter = null;
      
      // Use RPC approach for ALL periods - same as revenue chart
      const [weeklyData, monthlyData, yearlyData] = await Promise.all([
        calculateRollingFromWeeklyRPC(7, venueFilter),    // Use weekly RPC for 7 days
        calculateRollingFromWeeklyRPC(28, venueFilter),   // Use weekly RPC for 28 days  
        calculateRollingFromWeeklyRPC(365, venueFilter)   // Use weekly RPC for 365 days
      ]);

      setDashboardData({
        weekly: weeklyData,
        monthly: monthlyData,
        yearly: yearlyData
      });
    } catch (error) {
      // Error fetching revenue data - silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRollingFromWeeklyRPC = async (daysBack: number, venueFilter: string | null): Promise<RevenueMetrics> => {
    try {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      const previousCutoffDate = new Date(now.getTime() - (daysBack * 2 * 24 * 60 * 60 * 1000));
      const yearAgoCutoffDate = new Date(cutoffDate);
      yearAgoCutoffDate.setFullYear(yearAgoCutoffDate.getFullYear() - 1);
      const yearAgoEndDate = new Date(now);
      yearAgoEndDate.setFullYear(yearAgoEndDate.getFullYear() - 1);

      // Simple revenue queries
      const [currentRevenue, previousRevenue, yearAgoRevenue] = await Promise.all([
        getDirectRevenueForPeriod(cutoffDate, now, venueFilter),
        getDirectRevenueForPeriod(previousCutoffDate, cutoffDate, venueFilter),
        getDirectRevenueForPeriod(yearAgoCutoffDate, yearAgoEndDate, venueFilter)
      ]);

      // Simple attendance queries - just sum door_ticket_qty for each period
      const [currentAttendance, previousAttendance, yearAgoAttendance] = await Promise.all([
        getAttendanceForPeriod(cutoffDate, now, venueFilter),
        getAttendanceForPeriod(previousCutoffDate, cutoffDate, venueFilter),
        getAttendanceForPeriod(yearAgoCutoffDate, yearAgoEndDate, venueFilter)
      ]);

      // Calculate spend per head
      const currentSpendPerHead = currentAttendance > 0 ? (currentRevenue / 100) / currentAttendance : 0;
      const previousSpendPerHead = previousAttendance > 0 ? (previousRevenue / 100) / previousAttendance : 0;
      const yearAgoSpendPerHead = yearAgoAttendance > 0 ? (yearAgoRevenue / 100) / yearAgoAttendance : 0;

      // Calculate change percentages
      const changePercent = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const changePercentYear = yearAgoRevenue > 0 ? ((currentRevenue - yearAgoRevenue) / yearAgoRevenue) * 100 : 0;
      const attendanceChangePercent = previousAttendance > 0 ? ((currentAttendance - previousAttendance) / previousAttendance) * 100 : 0;
      const attendanceChangePercentYear = yearAgoAttendance > 0 ? ((currentAttendance - yearAgoAttendance) / yearAgoAttendance) * 100 : 0;
      const spendPerHeadChangePercent = previousSpendPerHead > 0 ? ((currentSpendPerHead - previousSpendPerHead) / previousSpendPerHead) * 100 : 0;
      const spendPerHeadChangePercentYear = yearAgoSpendPerHead > 0 ? ((currentSpendPerHead - yearAgoSpendPerHead) / yearAgoSpendPerHead) * 100 : 0;

      return {
        current: currentRevenue,
        previous: previousRevenue,
        previousYear: yearAgoRevenue,
        currentFormatted: formatCurrency(currentRevenue),
        previousFormatted: formatCurrency(previousRevenue),
        previousYearFormatted: formatCurrency(yearAgoRevenue),
        changePercent,
        changePercentYear,
        currentAttendance,
        previousAttendance,
        previousYearAttendance: yearAgoAttendance,
        currentSpendPerHead,
        previousSpendPerHead,
        previousYearSpendPerHead: yearAgoSpendPerHead,
        currentSpendPerHeadFormatted: `$${currentSpendPerHead.toFixed(2)}`,
        previousSpendPerHeadFormatted: `$${previousSpendPerHead.toFixed(2)}`,
        previousYearSpendPerHeadFormatted: `$${yearAgoSpendPerHead.toFixed(2)}`,
        attendanceChangePercent,
        attendanceChangePercentYear,
        spendPerHeadChangePercent,
        spendPerHeadChangePercentYear
      };

    } catch (_error) {
      return createEmptyMetrics();
    }
  };

  // Helper function to create empty metrics
  const createEmptyMetrics = (): RevenueMetrics => ({
    current: 0,
    previous: 0,
    previousYear: 0,
    currentFormatted: '$0',
    previousFormatted: '$0',
    previousYearFormatted: '$0',
    changePercent: 0,
    changePercentYear: 0,
    currentAttendance: 0,
    previousAttendance: 0,
    previousYearAttendance: 0,
    currentSpendPerHead: 0,
    previousSpendPerHead: 0,
    previousYearSpendPerHead: 0,
    currentSpendPerHeadFormatted: '$0.00',
    previousSpendPerHeadFormatted: '$0.00',
    previousYearSpendPerHeadFormatted: '$0.00',
    attendanceChangePercent: 0,
    attendanceChangePercentYear: 0,
    spendPerHeadChangePercent: 0,
    spendPerHeadChangePercentYear: 0
  });

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally run only on mount - fetchRevenueData reference changes on every render
  }, []);

  const getDirectRevenueForPeriod = async (startDate: Date, endDate: Date, venueFilter: string | null = null): Promise<number> => {
    try {
      // Use direct SQL query to avoid pagination issues
      const { data, error } = await supabase.rpc('get_revenue_sum', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        venue_filter: venueFilter
      });

      if (error) {
        return 0;
      }

      return data || 0;
    } catch (_error) {
      return 0;
    }
  };

  const getAttendanceForPeriod = async (startDate: Date, endDate: Date, venueFilter: string | null = null): Promise<number> => {
    try {
      // Use direct SQL query to avoid pagination issues
      const { data, error } = await supabase.rpc('get_attendance_sum', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        venue_filter: venueFilter
      });

      if (error) {
        return 0;
      }

      return data || 0;
    } catch (_error) {
      return 0;
    }
  };

  const formatCurrency = (cents: number): string => {
    // Convert from GST inclusive to GST exclusive by dividing by 1.1
    const gstExclusiveAmount = (cents / 100) / 1.1;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(gstExclusiveAmount);
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
          <h1 className="text-3xl font-bold text-gm-neutral-900 dark:text-white">Revenue Dashboard</h1>
          <p className="text-gm-neutral-600 dark:text-gm-neutral-400">Track your revenue performance across different time periods.</p>
        </div>

        {/* Comparison Type Toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gm-neutral-600 dark:text-gm-neutral-300">Compare to:</span>
          <div className="flex bg-gm-neutral-100 dark:bg-gm-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setComparisonType('previous')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                comparisonType === 'previous'
                  ? 'bg-white dark:bg-gm-neutral-700 text-gm-neutral-900 dark:text-white shadow-sm'
                  : 'text-gm-neutral-600 dark:text-gm-neutral-400 hover:text-gm-neutral-900 dark:hover:text-white'
              }`}
            >
              Previous Period
            </button>
            <button
              onClick={() => setComparisonType('year')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                comparisonType === 'year'
                  ? 'bg-white dark:bg-gm-neutral-700 text-gm-neutral-900 dark:text-white shadow-sm'
                  : 'text-gm-neutral-600 dark:text-gm-neutral-400 hover:text-gm-neutral-900 dark:hover:text-white'
              }`}
            >
              Same Period Last Year
            </button>
          </div>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" key={refreshKey}>
          {/* Last 7 Days Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Revenue */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.weekly.currentFormatted}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.weekly.changePercent || 0)
                      : (dashboardData?.weekly.changePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.weekly.changePercent || 0)
                      : (dashboardData?.weekly.changePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.weekly.changePercent || 0)
                        : (dashboardData?.weekly.changePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>

              {/* Attendance */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Attendance</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.weekly.currentAttendance.toLocaleString()}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.weekly.attendanceChangePercent || 0)
                      : (dashboardData?.weekly.attendanceChangePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.weekly.attendanceChangePercent || 0)
                      : (dashboardData?.weekly.attendanceChangePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.weekly.attendanceChangePercent || 0)
                        : (dashboardData?.weekly.attendanceChangePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>

              {/* Spend per Head */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">$ per Head</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.weekly.currentSpendPerHeadFormatted}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.weekly.spendPerHeadChangePercent || 0)
                      : (dashboardData?.weekly.spendPerHeadChangePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.weekly.spendPerHeadChangePercent || 0)
                      : (dashboardData?.weekly.spendPerHeadChangePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.weekly.spendPerHeadChangePercent || 0)
                        : (dashboardData?.weekly.spendPerHeadChangePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last 28 Days Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 28 Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Revenue */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.monthly.currentFormatted}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.monthly.changePercent || 0)
                      : (dashboardData?.monthly.changePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.monthly.changePercent || 0)
                      : (dashboardData?.monthly.changePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.monthly.changePercent || 0)
                        : (dashboardData?.monthly.changePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>

              {/* Attendance */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Attendance</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.monthly.currentAttendance.toLocaleString()}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.monthly.attendanceChangePercent || 0)
                      : (dashboardData?.monthly.attendanceChangePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.monthly.attendanceChangePercent || 0)
                      : (dashboardData?.monthly.attendanceChangePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.monthly.attendanceChangePercent || 0)
                        : (dashboardData?.monthly.attendanceChangePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>

              {/* Spend per Head */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">$ per Head</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.monthly.currentSpendPerHeadFormatted}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.monthly.spendPerHeadChangePercent || 0)
                      : (dashboardData?.monthly.spendPerHeadChangePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.monthly.spendPerHeadChangePercent || 0)
                      : (dashboardData?.monthly.spendPerHeadChangePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.monthly.spendPerHeadChangePercent || 0)
                        : (dashboardData?.monthly.spendPerHeadChangePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last 365 Days Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 365 Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Revenue */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.yearly.currentFormatted}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.yearly.changePercent || 0)
                      : (dashboardData?.yearly.changePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.yearly.changePercent || 0)
                      : (dashboardData?.yearly.changePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.yearly.changePercent || 0)
                        : (dashboardData?.yearly.changePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>

              {/* Attendance */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Attendance</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.yearly.currentAttendance.toLocaleString()}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.yearly.attendanceChangePercent || 0)
                      : (dashboardData?.yearly.attendanceChangePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.yearly.attendanceChangePercent || 0)
                      : (dashboardData?.yearly.attendanceChangePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.yearly.attendanceChangePercent || 0)
                        : (dashboardData?.yearly.attendanceChangePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
              </div>

              {/* Spend per Head */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">$ per Head</span>
                </div>
                <div className="text-xl font-bold">{dashboardData?.yearly.currentSpendPerHeadFormatted}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getTrendIcon(
                    comparisonType === 'previous' 
                      ? (dashboardData?.yearly.spendPerHeadChangePercent || 0)
                      : (dashboardData?.yearly.spendPerHeadChangePercentYear || 0)
                  )}
                  <span className={getTrendColor(
                    comparisonType === 'previous' 
                      ? (dashboardData?.yearly.spendPerHeadChangePercent || 0)
                      : (dashboardData?.yearly.spendPerHeadChangePercentYear || 0)
                  )}>
                    {formatPercent(
                      comparisonType === 'previous' 
                        ? (dashboardData?.yearly.spendPerHeadChangePercent || 0)
                        : (dashboardData?.yearly.spendPerHeadChangePercentYear || 0)
                    )} {comparisonType === 'previous' ? 'vs previous' : 'vs last year'}
                  </span>
                </div>
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
