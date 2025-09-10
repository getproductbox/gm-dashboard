
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [comparisonType, setComparisonType] = useState<'previous' | 'year'>('previous');





  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      
      console.log('=== FETCHING DASHBOARD STATS (ALL VENUES) ===');
      
      // Dashboard stats always use ALL venues (no filtering)
      const venueFilter = null;
      
      // Use RPC approach for ALL periods - same as revenue chart
      const [weeklyData, monthlyData, yearlyData] = await Promise.all([
        calculateRollingFromWeeklyRPC(7, venueFilter),    // Use weekly RPC for 7 days
        calculateRollingFromWeeklyRPC(28, venueFilter),   // Use weekly RPC for 28 days  
        calculateRollingFromWeeklyRPC(365, venueFilter)   // Use weekly RPC for 365 days
      ]);

      console.log('Dashboard Stats Results (All Venues):', { weeklyData, monthlyData, yearlyData });

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

  const calculateRollingFromWeeklyRPC = async (daysBack: number, venueFilter: string | null): Promise<RevenueMetrics> => {
    try {
      console.log(`Calculating rolling ${daysBack} days with simple queries...`);
      
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

      console.log(`${daysBack} days totals:`, {
        revenue: { current: currentRevenue/100, previous: previousRevenue/100, yearAgo: yearAgoRevenue/100 },
        attendance: { current: currentAttendance, previous: previousAttendance, yearAgo: yearAgoAttendance },
        spendPerHead: { current: currentSpendPerHead, previous: previousSpendPerHead, yearAgo: yearAgoSpendPerHead }
      });

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

    } catch (error) {
      console.error(`Error in calculateRollingFromWeeklyRPC for ${daysBack} days:`, error);
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

  const calculateSimpleRollingPeriod = async (daysBack: number, venueFilter: string | null): Promise<RevenueMetrics> => {
    try {
      console.log(`Calculating simple rolling ${daysBack} days with direct query...`);
      
      const now = new Date();
      
      // Current period: last N days
      let currentQuery = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000)).toISOString());

      if (venueFilter) {
        currentQuery = currentQuery.eq('venue', venueFilter);
      }

      // Previous period: N days before that
      let previousQuery = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', new Date(now.getTime() - (daysBack * 2 * 24 * 60 * 60 * 1000)).toISOString())
        .lt('payment_date', new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000)).toISOString());

      if (venueFilter) {
        previousQuery = previousQuery.eq('venue', venueFilter);
      }

      // Year ago period: same N days last year
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      let yearAgoQuery = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', new Date(yearAgo.getTime() - (daysBack * 24 * 60 * 60 * 1000)).toISOString())
        .lte('payment_date', yearAgo.toISOString());

      if (venueFilter) {
        yearAgoQuery = yearAgoQuery.eq('venue', venueFilter);
      }

      const [currentResult, previousResult, yearAgoResult] = await Promise.all([
        currentQuery,
        previousQuery,
        yearAgoQuery
      ]);

      // Check for errors
      if (currentResult.error || previousResult.error || yearAgoResult.error) {
        console.error('Errors in simple rolling period:', {
          current: currentResult.error,
          previous: previousResult.error,
          yearAgo: yearAgoResult.error
        });
      }

      const currentRevenue = (currentResult.data || []).reduce((sum, event) => sum + event.amount_cents, 0);
      const previousRevenue = (previousResult.data || []).reduce((sum, event) => sum + event.amount_cents, 0);
      const yearAgoRevenue = (yearAgoResult.data || []).reduce((sum, event) => sum + event.amount_cents, 0);

      console.log(`Simple ${daysBack} days: current=${currentResult.data?.length} events ($${currentRevenue/100}), previous=${previousResult.data?.length} events ($${previousRevenue/100}), yearAgo=${yearAgoResult.data?.length} events ($${yearAgoRevenue/100})`);

      const changePercent = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const changePercentYear = yearAgoRevenue > 0 ? ((currentRevenue - yearAgoRevenue) / yearAgoRevenue) * 100 : 0;

      return {
        current: currentRevenue,
        previous: previousRevenue,
        previousYear: yearAgoRevenue,
        currentFormatted: formatCurrency(currentRevenue),
        previousFormatted: formatCurrency(previousRevenue),
        previousYearFormatted: formatCurrency(yearAgoRevenue),
        changePercent,
        changePercentYear,
        // Attendance not calculated in this function
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
      };

    } catch (error) {
      console.error(`Error in calculateSimpleRollingPeriod for ${daysBack} days:`, error);
      return createEmptyMetrics();
    }
  };

  const calculateRollingPeriodFromRPC = async (
    rpcType: 'weekly' | 'monthly' | 'yearly',
    daysBack: number,
    venueFilter: string | null
  ): Promise<RevenueMetrics> => {
    try {
      console.log(`Calculating rolling ${daysBack} days using ${rpcType} RPC...`);
      
      // Fetch the summary data using RPC (same as revenue chart)
      let data, error;
      if (rpcType === 'weekly') {
        ({ data, error } = await supabase.rpc('get_weekly_revenue_summary', {
          venue_filter: venueFilter,
          week_date: null
        }));
      } else if (rpcType === 'monthly') {
        ({ data, error } = await supabase.rpc('get_monthly_revenue_summary', {
          venue_filter: venueFilter,
          month_date: null
        }));
      } else {
        ({ data, error } = await supabase.rpc('get_yearly_revenue_summary', {
          venue_filter: venueFilter,
          year_date: null
        }));
      }
      
      if (error) {
        console.error(`Error fetching ${rpcType} revenue:`, error);
        return createEmptyMetrics();
      }
      
      // Calculate rolling period totals from the aggregated data
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      const previousCutoffDate = new Date(now.getTime() - (daysBack * 2 * 24 * 60 * 60 * 1000));
      const yearAgoCutoffDate = new Date(cutoffDate.getTime());
      yearAgoCutoffDate.setFullYear(yearAgoCutoffDate.getFullYear() - 1);
      
      console.log(`Date filters for ${daysBack} days:`, {
        now: now.toISOString(),
        cutoffDate: cutoffDate.toISOString(),
        previousCutoffDate: previousCutoffDate.toISOString(),
        yearAgoCutoffDate: yearAgoCutoffDate.toISOString()
      });
      
      let currentTotal = 0;
      let previousTotal = 0; 
      let yearAgoTotal = 0;
      
      if (Array.isArray(data)) {
        data.forEach((row) => {
          const rowDate = new Date(row.week_start || row.month_start || row.year_start);
          
          console.log(`Processing row: ${rowDate.toISOString()}, revenue: $${(row.total_revenue_cents || 0) / 100}`);
          
          // Current period: last N days
          if (rowDate >= cutoffDate) {
            currentTotal += row.total_revenue_cents || 0;
            console.log(`  -> Added to current: $${(row.total_revenue_cents || 0) / 100}`);
          }
          // Previous period: N days before that  
          else if (rowDate >= previousCutoffDate && rowDate < cutoffDate) {
            previousTotal += row.total_revenue_cents || 0;
            console.log(`  -> Added to previous: $${(row.total_revenue_cents || 0) / 100}`);
          }
          // Year ago period - more flexible matching
          else {
            const yearAgoStart = new Date(yearAgoCutoffDate);
            const yearAgoEnd = new Date(now);
            yearAgoEnd.setFullYear(yearAgoEnd.getFullYear() - 1);
            
            if (rowDate >= yearAgoStart && rowDate <= yearAgoEnd) {
              yearAgoTotal += row.total_revenue_cents || 0;
              console.log(`  -> Added to year ago: $${(row.total_revenue_cents || 0) / 100}`);
            }
          }
        });
      }
      
      const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
      const changePercentYear = yearAgoTotal > 0 ? ((currentTotal - yearAgoTotal) / yearAgoTotal) * 100 : 0;
      
      console.log(`${daysBack} days via RPC: current=$${currentTotal/100}, previous=$${previousTotal/100}, yearAgo=$${yearAgoTotal/100}`);
      
      return {
        current: currentTotal,
        previous: previousTotal,
        previousYear: yearAgoTotal,
        currentFormatted: formatCurrency(currentTotal),
        previousFormatted: formatCurrency(previousTotal),
        previousYearFormatted: formatCurrency(yearAgoTotal),
        changePercent,
        changePercentYear,
        // Attendance not calculated in this function
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
      };
      
    } catch (error) {
      console.error(`Error in calculateRollingPeriodFromRPC for ${daysBack} days:`, error);
      return createEmptyMetrics();
    }
  };

  const fetchAllDataWithPagination = async (daysBack: number) => {
    const allData: { amount_cents: number }[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    console.log(`Fetching all data for last ${daysBack} days with pagination...`);
    
    while (hasMore) {
      const { data, error, count } = await supabase
        .from('revenue_events')
        .select('amount_cents', { count: 'exact' })
        .eq('status', 'completed')
        .gte('payment_date', new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString())
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`Error fetching page starting at ${from}:`, error);
        break;
      }
      
      if (data && data.length > 0) {
        allData.push(...data);
        console.log(`Fetched page: ${from}-${from + data.length - 1}, total so far: ${allData.length}`);
        from += pageSize;
        hasMore = data.length === pageSize; // Continue if we got a full page
      } else {
        hasMore = false;
      }
    }
    
    const total = allData.reduce((sum, event) => sum + event.amount_cents, 0);
    console.log(`✅ Last ${daysBack} days: ${allData.length} events, $${(total/100).toLocaleString()}`);
    
    return { events: allData.length, total };
  };

  const testDirectDatabaseQueries = async () => {
    try {
      console.log('=== TESTING WITH PAGINATION ===');
      
      await fetchAllDataWithPagination(7);
      await fetchAllDataWithPagination(28);
      await fetchAllDataWithPagination(365);
      
      console.log('=== END PAGINATION TEST ===');
      
    } catch (error) {
      console.error('Error in direct database test:', error);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSimpleRollingRevenue = async (
    currentStart: Date, 
    currentEnd: Date, 
    previousStart: Date, 
    previousEnd: Date,
    comparisonStart: Date,
    comparisonEnd: Date,
    venueFilter: string | null = null
  ): Promise<RevenueMetrics> => {
    const [currentRevenue, previousRevenue, comparisonRevenue] = await Promise.all([
      getDirectRevenueForPeriod(currentStart, currentEnd, venueFilter),
      getDirectRevenueForPeriod(previousStart, previousEnd, venueFilter),
      getDirectRevenueForPeriod(comparisonStart, comparisonEnd, venueFilter)
    ]);

    const changePercent = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const changePercentYear = comparisonRevenue > 0 ? ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100 : 0;

    const result = {
      current: currentRevenue,
      previous: previousRevenue,
      previousYear: comparisonRevenue,
      currentFormatted: formatCurrency(currentRevenue),
      previousFormatted: formatCurrency(previousRevenue),
      previousYearFormatted: formatCurrency(comparisonRevenue),
      changePercent,
      changePercentYear,
      // Attendance not calculated in this function
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
    };

    console.log('fetchSimpleRollingRevenue result:', result);
    return result;
  };

  const fetchRollingPeriodRevenue = async (
    currentStart: Date, 
    currentEnd: Date, 
    previousStart: Date, 
    previousEnd: Date,
    comparisonStart: Date,
    comparisonEnd: Date,
    venueFilter: string | null = null
  ): Promise<RevenueMetrics> => {
    const [currentRevenue, previousRevenue, comparisonRevenue] = await Promise.all([
      getRollingRevenueForPeriod(currentStart, currentEnd, venueFilter),
      getRollingRevenueForPeriod(previousStart, previousEnd, venueFilter),
      getRollingRevenueForPeriod(comparisonStart, comparisonEnd, venueFilter)
    ]);

    const changePercent = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const changePercentYear = comparisonRevenue > 0 ? ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100 : 0;

    return {
      current: currentRevenue,
      previous: previousRevenue,
      previousYear: comparisonRevenue,
      currentFormatted: formatCurrency(currentRevenue),
      previousFormatted: formatCurrency(previousRevenue),
      previousYearFormatted: formatCurrency(comparisonRevenue),
      changePercent,
      changePercentYear,
      // Attendance not calculated in this function
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
    };
  };

  const fetchDaysBackRevenue = async (daysBack: number, venueFilter: string | null = null): Promise<RevenueMetrics> => {
    try {
      console.log(`Fetching ${daysBack} days back revenue, venue: ${venueFilter || 'all'}`);
      
      // Current period: last N days
      let currentQuery = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString());

      if (venueFilter) {
        currentQuery = currentQuery.eq('venue', venueFilter);
      }

      // Previous period: N days before that
      let previousQuery = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', new Date(Date.now() - (daysBack * 2 * 24 * 60 * 60 * 1000)).toISOString())
        .lt('payment_date', new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString());

      if (venueFilter) {
        previousQuery = previousQuery.eq('venue', venueFilter);
      }

      // Year ago period: same N days last year
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      let yearAgoQuery = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', new Date(yearAgo.getTime() - (daysBack * 24 * 60 * 60 * 1000)).toISOString())
        .lt('payment_date', yearAgo.toISOString());

      if (venueFilter) {
        yearAgoQuery = yearAgoQuery.eq('venue', venueFilter);
      }

      const [currentResult, previousResult, yearAgoResult] = await Promise.all([
        currentQuery,
        previousQuery,
        yearAgoQuery
      ]);

      const currentRevenue = (currentResult.data || []).reduce((sum, event) => sum + event.amount_cents, 0);
      const previousRevenue = (previousResult.data || []).reduce((sum, event) => sum + event.amount_cents, 0);
      const yearAgoRevenue = (yearAgoResult.data || []).reduce((sum, event) => sum + event.amount_cents, 0);

      const changePercent = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const changePercentYear = yearAgoRevenue > 0 ? ((currentRevenue - yearAgoRevenue) / yearAgoRevenue) * 100 : 0;

      console.log(`${daysBack} days: current=$${currentRevenue/100}, previous=$${previousRevenue/100}, yearAgo=$${yearAgoRevenue/100}`);

      return {
        current: currentRevenue,
        previous: previousRevenue,
        previousYear: yearAgoRevenue,
        currentFormatted: formatCurrency(currentRevenue),
        previousFormatted: formatCurrency(previousRevenue),
        previousYearFormatted: formatCurrency(yearAgoRevenue),
        changePercent,
        changePercentYear,
        // Attendance not calculated in this function
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
      };
    } catch (error) {
      console.error(`Error fetching ${daysBack} days revenue:`, error);
      return createEmptyMetrics();
    }
  };

  const getDirectRevenueForPeriod = async (startDate: Date, endDate: Date, venueFilter: string | null = null): Promise<number> => {
    try {
      // Use direct SQL query to avoid pagination issues
      const { data, error } = await supabase.rpc('get_revenue_sum', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        venue_filter: venueFilter
      });

      if (error) {
        console.error('Error fetching revenue:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getDirectRevenueForPeriod:', error);
      return 0;
    }
  };

  const getRollingRevenueForPeriod = async (startDate: Date, endDate: Date, venueFilter: string | null = null): Promise<number> => {
    try {
      let query = supabase
        .from('revenue_events')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString());

      if (venueFilter) {
        query = query.eq('venue', venueFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching rolling revenue:', error);
        return 0;
      }

      // Sum up all revenue for the period
      const totalRevenue = (data || []).reduce((sum, event) => sum + event.amount_cents, 0);
      return totalRevenue;
    } catch (error) {
      console.error('Error in getRollingRevenueForPeriod:', error);
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
        console.error('Error fetching attendance:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getAttendanceForPeriod:', error);
      return 0;
    }
  };

  const getRevenueForPeriod = async (startDate: Date, endDate: Date, periodType: 'weekly' | 'monthly' | 'yearly', venueFilter: string | null = null): Promise<number> => {
    try {
      let data, error;

      switch (periodType) {
        case 'weekly': {
          const weekStart = new Date(startDate);
          weekStart.setHours(0, 0, 0, 0);
          ({ data, error } = await supabase.rpc('get_weekly_revenue_summary', {
            venue_filter: venueFilter,
            week_date: weekStart.toISOString()
          }));
          break;
        }
        case 'monthly': {
          const monthStart = new Date(startDate);
          monthStart.setHours(0, 0, 0, 0);
          ({ data, error } = await supabase.rpc('get_monthly_revenue_summary', {
            venue_filter: venueFilter,
            month_date: monthStart.toISOString()
          }));
          break;
        }
        case 'yearly': {
          const yearStart = new Date(startDate);
          yearStart.setHours(0, 0, 0, 0);
          ({ data, error } = await supabase.rpc('get_yearly_revenue_summary', {
            venue_filter: venueFilter,
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

      // Return the total revenue for the period in cents
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
