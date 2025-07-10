import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RevenueData {
  week_start?: string;
  month?: string;
  year_start?: string;
  total_transactions: number;
  door_transactions: number;
  bar_transactions: number;
  door_revenue_cents: number;
  bar_revenue_cents: number;
  total_revenue_cents: number;
}

export const useRevenue = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeeklyData = useCallback(async (
    venueFilter?: string | null,
    weekDate?: Date | null
  ) => {
    try {
      const { data, error } = await supabase.rpc('get_weekly_revenue_summary', {
        venue_filter: venueFilter,
        week_date: weekDate?.toISOString() || null
      });

      if (error) throw error;
      return data as RevenueData[];
    } catch (error) {
      console.error('Error fetching weekly revenue:', error);
      throw error;
    }
  }, []);

  const fetchMonthlyData = useCallback(async (
    venueFilter?: string | null,
    monthDate?: Date | null
  ) => {
    try {
      const { data, error } = await supabase.rpc('get_monthly_revenue_summary', {
        venue_filter: venueFilter,
        month_date: monthDate?.toISOString() || null
      });

      if (error) throw error;
      return data as RevenueData[];
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw error;
    }
  }, []);

  const fetchYearlyData = useCallback(async (
    venueFilter?: string | null,
    yearDate?: Date | null
  ) => {
    try {
      const { data, error } = await supabase.rpc('get_yearly_revenue_summary', {
        venue_filter: venueFilter,
        year_date: yearDate?.toISOString() || null
      });

      if (error) throw error;
      return data as RevenueData[];
    } catch (error) {
      console.error('Error fetching yearly revenue:', error);
      throw error;
    }
  }, []);

  const fetchAllRevenueData = useCallback(async (
    venueFilter?: string | null,
    weekDate?: Date | null
  ) => {
    setIsLoading(true);
    try {
      const selectedDate = weekDate === null ? null : weekDate;
      
      const [weeklyData, monthlyData, yearlyData] = await Promise.all([
        fetchWeeklyData(venueFilter, selectedDate),
        fetchMonthlyData(venueFilter, selectedDate),
        fetchYearlyData(venueFilter, selectedDate)
      ]);

      return { weeklyData, monthlyData, yearlyData };
    } catch (error) {
      console.error('Error fetching all revenue data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWeeklyData, fetchMonthlyData, fetchYearlyData]);

  const fetchAvailableWeeks = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_weeks');
      if (error) throw error;
      return data as Array<{ week_start: string; week_label: string }>;
    } catch (error) {
      console.error('Error fetching available weeks:', error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    fetchWeeklyData,
    fetchMonthlyData,
    fetchYearlyData,
    fetchAllRevenueData,
    fetchAvailableWeeks
  };
};