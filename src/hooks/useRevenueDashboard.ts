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
    fetchAllMetrics
  };
};