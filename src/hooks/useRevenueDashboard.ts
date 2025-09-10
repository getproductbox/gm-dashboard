import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RevenueEvent {
  id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  payment_date: string;
  status: string;
}

export interface PeriodMetrics {
  totalRevenue: number;
  barRevenue: number;
  doorRevenue: number;
  eventCount: number;
}

export interface ComparisonMetrics {
  totalVariance: number;
  barVariance: number;
  doorVariance: number;
}

export interface CoreStatistic {
  currentPeriod: PeriodMetrics;
  lastYearPeriod: PeriodMetrics;
  previousPeriod: PeriodMetrics;
  totalVariance: number;
  barVariance: number;
  doorVariance: number;
  previousPeriodVariance: number;
  periodLabel: string;
  currentDateRange: { start: Date; end: Date };
  lastYearDateRange: { start: Date; end: Date };
  previousDateRange: { start: Date; end: Date };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export const useRevenueDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<PeriodMetrics>({ 
    totalRevenue: 0, 
    barRevenue: 0, 
    doorRevenue: 0,
    eventCount: 0
  });
  const [lastWeekComparison, setLastWeekComparison] = useState<ComparisonMetrics>({ 
    totalVariance: 0, 
    barVariance: 0, 
    doorVariance: 0 
  });
  const [lastMonthComparison, setLastMonthComparison] = useState<ComparisonMetrics>({ 
    totalVariance: 0, 
    barVariance: 0, 
    doorVariance: 0 
  });
  const [lastYearComparison, setLastYearComparison] = useState<ComparisonMetrics>({ 
    totalVariance: 0, 
    barVariance: 0, 
    doorVariance: 0 
  });
  const [coreStatistics, setCoreStatistics] = useState<CoreStatistic[]>([]);

  const fetchPeriodMetrics = useCallback(async (startDate: Date, endDate: Date, venueFilter?: string | null): Promise<PeriodMetrics> => {
    let query = supabase
      .from('revenue_events')
      .select('*')
      .eq('status', 'completed')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString());
    
    if (venueFilter && venueFilter !== 'all') {
      query = query.eq('venue', venueFilter);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    const events = (data || []) as RevenueEvent[];
    console.log(`Found ${events.length} events for period ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const totalRevenue = events.reduce((sum, event) => sum + event.amount_cents, 0);
    
    // Properly categorize revenue by type
    const barRevenue = events
      .filter(event => event.revenue_type === 'bar')
      .reduce((sum, event) => sum + event.amount_cents, 0);
    
    const doorRevenue = events
      .filter(event => event.revenue_type === 'door')
      .reduce((sum, event) => sum + event.amount_cents, 0);

    console.log(`Period metrics: total=${totalRevenue}, bar=${barRevenue}, door=${doorRevenue}, events=${events.length}`);
    
    return { 
      totalRevenue, 
      barRevenue, 
      doorRevenue,
      eventCount: events.length
    };
  }, []);

  const calculateVariance = useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const getComparisonRanges = useCallback((startDate: Date, endDate: Date) => {
    // Ensure start is beginning of day, end is end of day
    const currentStart = new Date(startDate);
    currentStart.setHours(0, 0, 0, 0);
    const currentEnd = new Date(endDate);
    currentEnd.setHours(23, 59, 59, 999);

    // Calculate period length in milliseconds
    const periodLengthMs = currentEnd.getTime() - currentStart.getTime();
    
    // Previous period (same length, immediately before current period)
    const lastWeekEnd = new Date(currentStart.getTime() - 1); // End just before current period starts
    lastWeekEnd.setHours(23, 59, 59, 999);
    const lastWeekStart = new Date(lastWeekEnd.getTime() - periodLengthMs + (24 * 60 * 60 * 1000)); // Same length period
    lastWeekStart.setHours(0, 0, 0, 0);

    // Same period from previous month
    const lastMonthStart = new Date(currentStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(lastMonthStart.getTime() + periodLengthMs);
    lastMonthEnd.setHours(23, 59, 59, 999);

    // Same period from previous year
    const lastYearStart = new Date(currentStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    lastYearStart.setHours(0, 0, 0, 0);
    const lastYearEnd = new Date(lastYearStart.getTime() + periodLengthMs);
    lastYearEnd.setHours(23, 59, 59, 999);

    console.log('Comparison ranges:', {
      current: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
      lastWeek: { start: lastWeekStart.toISOString(), end: lastWeekEnd.toISOString() },
      lastMonth: { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() },
      lastYear: { start: lastYearStart.toISOString(), end: lastYearEnd.toISOString() }
    });

    return {
      current: { start: currentStart, end: currentEnd },
      lastWeek: { start: lastWeekStart, end: lastWeekEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      lastYear: { start: lastYearStart, end: lastYearEnd }
    };
  }, []);

  const fetchCoreStatistics = useCallback(async (venueFilter?: string | null) => {
    // Use the same date as the existing data (July 3, 2025)
    const now = new Date(2025, 6, 3); // July 3, 2025 (latest data)
    now.setHours(23, 59, 59, 999);

    const coreStats: CoreStatistic[] = [];

    // Last 7 days
    const last7DaysEnd = new Date(now);
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);
    last7DaysStart.setHours(0, 0, 0, 0);

    const last7DaysLastYearEnd = new Date(last7DaysEnd);
    last7DaysLastYearEnd.setFullYear(last7DaysLastYearEnd.getFullYear() - 1);
    const last7DaysLastYearStart = new Date(last7DaysStart);
    last7DaysLastYearStart.setFullYear(last7DaysLastYearStart.getFullYear() - 1);

    // Last 28 days
    const last28DaysEnd = new Date(now);
    const last28DaysStart = new Date(now);
    last28DaysStart.setDate(last28DaysStart.getDate() - 27);
    last28DaysStart.setHours(0, 0, 0, 0);

    const last28DaysLastYearEnd = new Date(last28DaysEnd);
    last28DaysLastYearEnd.setFullYear(last28DaysLastYearEnd.getFullYear() - 1);
    const last28DaysLastYearStart = new Date(last28DaysStart);
    last28DaysLastYearStart.setFullYear(last28DaysLastYearStart.getFullYear() - 1);

    // Last 365 days
    const last365DaysEnd = new Date(now);
    const last365DaysStart = new Date(now);
    last365DaysStart.setDate(last365DaysStart.getDate() - 364);
    last365DaysStart.setHours(0, 0, 0, 0);

    const last365DaysLastYearEnd = new Date(last365DaysEnd);
    last365DaysLastYearEnd.setFullYear(last365DaysLastYearEnd.getFullYear() - 1);
    const last365DaysLastYearStart = new Date(last365DaysStart);
    last365DaysLastYearStart.setFullYear(last365DaysLastYearStart.getFullYear() - 1);

    // Calculate previous periods (same length, immediately before current period)
    const last7DaysPreviousEnd = new Date(last7DaysStart.getTime() - 1);
    last7DaysPreviousEnd.setHours(23, 59, 59, 999);
    const last7DaysPreviousStart = new Date(last7DaysPreviousEnd.getTime() - (7 * 24 * 60 * 60 * 1000) + (24 * 60 * 60 * 1000));
    last7DaysPreviousStart.setHours(0, 0, 0, 0);

    const last28DaysPreviousEnd = new Date(last28DaysStart.getTime() - 1);
    last28DaysPreviousEnd.setHours(23, 59, 59, 999);
    const last28DaysPreviousStart = new Date(last28DaysPreviousEnd.getTime() - (28 * 24 * 60 * 60 * 1000) + (24 * 60 * 60 * 1000));
    last28DaysPreviousStart.setHours(0, 0, 0, 0);

    const last365DaysPreviousEnd = new Date(last365DaysStart.getTime() - 1);
    last365DaysPreviousEnd.setHours(23, 59, 59, 999);
    const last365DaysPreviousStart = new Date(last365DaysPreviousEnd.getTime() - (365 * 24 * 60 * 60 * 1000) + (24 * 60 * 60 * 1000));
    last365DaysPreviousStart.setHours(0, 0, 0, 0);

    try {
      // Fetch all metrics in parallel
      const [
        last7DaysCurrent, last7DaysLastYear, last7DaysPrevious,
        last28DaysCurrent, last28DaysLastYear, last28DaysPrevious,
        last365DaysCurrent, last365DaysLastYear, last365DaysPrevious
      ] = await Promise.all([
        fetchPeriodMetrics(last7DaysStart, last7DaysEnd, venueFilter),
        fetchPeriodMetrics(last7DaysLastYearStart, last7DaysLastYearEnd, venueFilter),
        fetchPeriodMetrics(last7DaysPreviousStart, last7DaysPreviousEnd, venueFilter),
        fetchPeriodMetrics(last28DaysStart, last28DaysEnd, venueFilter),
        fetchPeriodMetrics(last28DaysLastYearStart, last28DaysLastYearEnd, venueFilter),
        fetchPeriodMetrics(last28DaysPreviousStart, last28DaysPreviousEnd, venueFilter),
        fetchPeriodMetrics(last365DaysStart, last365DaysEnd, venueFilter),
        fetchPeriodMetrics(last365DaysLastYearStart, last365DaysLastYearEnd, venueFilter),
        fetchPeriodMetrics(last365DaysPreviousStart, last365DaysPreviousEnd, venueFilter)
      ]);

      // Build core statistics
      coreStats.push({
        currentPeriod: last7DaysCurrent,
        lastYearPeriod: last7DaysLastYear,
        previousPeriod: last7DaysPrevious,
        totalVariance: calculateVariance(last7DaysCurrent.totalRevenue, last7DaysLastYear.totalRevenue),
        barVariance: calculateVariance(last7DaysCurrent.barRevenue, last7DaysLastYear.barRevenue),
        doorVariance: calculateVariance(last7DaysCurrent.doorRevenue, last7DaysLastYear.doorRevenue),
        previousPeriodVariance: calculateVariance(last7DaysCurrent.totalRevenue, last7DaysPrevious.totalRevenue),
        periodLabel: 'Last 7 Days',
        currentDateRange: { start: last7DaysStart, end: last7DaysEnd },
        lastYearDateRange: { start: last7DaysLastYearStart, end: last7DaysLastYearEnd },
        previousDateRange: { start: last7DaysPreviousStart, end: last7DaysPreviousEnd }
      });

      coreStats.push({
        currentPeriod: last28DaysCurrent,
        lastYearPeriod: last28DaysLastYear,
        previousPeriod: last28DaysPrevious,
        totalVariance: calculateVariance(last28DaysCurrent.totalRevenue, last28DaysLastYear.totalRevenue),
        barVariance: calculateVariance(last28DaysCurrent.barRevenue, last28DaysLastYear.barRevenue),
        doorVariance: calculateVariance(last28DaysCurrent.doorRevenue, last28DaysLastYear.doorRevenue),
        previousPeriodVariance: calculateVariance(last28DaysCurrent.totalRevenue, last28DaysPrevious.totalRevenue),
        periodLabel: 'Last 28 Days',
        currentDateRange: { start: last28DaysStart, end: last28DaysEnd },
        lastYearDateRange: { start: last28DaysLastYearStart, end: last28DaysLastYearEnd },
        previousDateRange: { start: last28DaysPreviousStart, end: last28DaysPreviousEnd }
      });

      coreStats.push({
        currentPeriod: last365DaysCurrent,
        lastYearPeriod: last365DaysLastYear,
        previousPeriod: last365DaysPrevious,
        totalVariance: calculateVariance(last365DaysCurrent.totalRevenue, last365DaysLastYear.totalRevenue),
        barVariance: calculateVariance(last365DaysCurrent.barRevenue, last365DaysLastYear.barRevenue),
        doorVariance: calculateVariance(last365DaysCurrent.doorRevenue, last365DaysLastYear.doorRevenue),
        previousPeriodVariance: calculateVariance(last365DaysCurrent.totalRevenue, last365DaysPrevious.totalRevenue),
        periodLabel: 'Last 365 Days',
        currentDateRange: { start: last365DaysStart, end: last365DaysEnd },
        lastYearDateRange: { start: last365DaysLastYearStart, end: last365DaysLastYearEnd },
        previousDateRange: { start: last365DaysPreviousStart, end: last365DaysPreviousEnd }
      });

      setCoreStatistics(coreStats);
    } catch (error) {
      console.error('Error fetching core statistics:', error);
      toast.error('Failed to fetch core statistics. Please try again.');
    }
  }, [fetchPeriodMetrics, calculateVariance]);

  const fetchAllMetrics = useCallback(async (startDate: Date, endDate: Date, venueFilter?: string | null) => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    setIsLoading(true);
    try {
      const ranges = getComparisonRanges(startDate, endDate);

      const [currentMetrics, lastWeekMetrics, lastMonthMetrics, lastYearMetrics] = await Promise.all([
        fetchPeriodMetrics(ranges.current.start, ranges.current.end, venueFilter),
        fetchPeriodMetrics(ranges.lastWeek.start, ranges.lastWeek.end, venueFilter),
        fetchPeriodMetrics(ranges.lastMonth.start, ranges.lastMonth.end, venueFilter),
        fetchPeriodMetrics(ranges.lastYear.start, ranges.lastYear.end, venueFilter)
      ]);

      setCurrentPeriod(currentMetrics);

      setLastWeekComparison({
        totalVariance: calculateVariance(currentMetrics.totalRevenue, lastWeekMetrics.totalRevenue),
        barVariance: calculateVariance(currentMetrics.barRevenue, lastWeekMetrics.barRevenue),
        doorVariance: calculateVariance(currentMetrics.doorRevenue, lastWeekMetrics.doorRevenue)
      });

      setLastMonthComparison({
        totalVariance: calculateVariance(currentMetrics.totalRevenue, lastMonthMetrics.totalRevenue),
        barVariance: calculateVariance(currentMetrics.barRevenue, lastMonthMetrics.barRevenue),
        doorVariance: calculateVariance(currentMetrics.doorRevenue, lastMonthMetrics.doorRevenue)
      });

      setLastYearComparison({
        totalVariance: calculateVariance(currentMetrics.totalRevenue, lastYearMetrics.totalRevenue),
        barVariance: calculateVariance(currentMetrics.barRevenue, lastYearMetrics.barRevenue),
        doorVariance: calculateVariance(currentMetrics.doorRevenue, lastYearMetrics.doorRevenue)
      });

      if (currentMetrics.eventCount === 0) {
        toast.info('No revenue data found for the selected date range');
      }

    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      toast.error('Failed to fetch revenue data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPeriodMetrics, calculateVariance, getComparisonRanges]);

  return {
    isLoading,
    currentPeriod,
    lastWeekComparison,
    lastMonthComparison,
    lastYearComparison,
    coreStatistics,
    fetchAllMetrics,
    fetchCoreStatistics
  };
};