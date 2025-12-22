import { useQuery } from '@tanstack/react-query';
import { financialService, WeeklyFinancials, FinancialKPIs } from '../services/financialService';
import { bookingService, BookingRow } from '../services/bookingService';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, parse } from 'date-fns';

export interface DashboardData {
  financials: WeeklyFinancials[];
  kpis: FinancialKPIs | null;
  upcomingBookings: BookingRow[];
  utilization: number;
  isLoading: boolean;
  error: string | null;
}

// Fetcher function for dashboard data
async function fetchDashboardData(): Promise<Omit<DashboardData, 'isLoading' | 'error'>> {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const dateFrom = format(today, 'yyyy-MM-dd');
  const dateTo = format(nextWeek, 'yyyy-MM-dd');

  // 1. Fetch Financials and KPIs in parallel
  const [financials, kpis] = await Promise.all([
    financialService.fetchWeeklyFinancials(12), // Last 12 weeks
    financialService.fetchKPIs(28) // Last 28 days (rolling)
  ]);

  // 2. Fetch Upcoming Bookings
  const allBookings = await bookingService.getBookings({
    dateFrom,
    dateTo,
    status: 'confirmed'
  });

  // 3. Calculate Utilization (Karaoke Only)
  const karaokeBookings = allBookings.filter(b => b.booking_type === 'karaoke_booking');
  
  // Fetch booths to get operating hours
  const { data: booths } = await supabase.from('karaoke_booths').select('*');
  
  let totalCapacityHours = 0;
  let totalBookedHours = 0;

  if (booths) {
    booths.forEach(booth => {
      const start = parse(booth.operating_hours_start || '18:00', 'HH:mm', new Date());
      const end = parse(booth.operating_hours_end || '02:00', 'HH:mm', new Date());
      
      // Handle crossing midnight
      let hoursPerDay = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hoursPerDay < 0) hoursPerDay += 24;
      
      totalCapacityHours += hoursPerDay * 7; // 7 days
    });

    // Sum duration of bookings
    totalBookedHours = karaokeBookings.reduce((acc, b) => acc + (b.duration_hours || 0), 0);
  }

  const utilization = totalCapacityHours > 0 
    ? (totalBookedHours / totalCapacityHours) * 100 
    : 0;

  return {
    financials,
    kpis,
    upcomingBookings: allBookings.slice(0, 10), // Top 10 next bookings
    utilization
  };
}

export function useDashboardData(): DashboardData {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes - dashboard data doesn't change frequently
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  return {
    financials: data?.financials ?? [],
    kpis: data?.kpis ?? null,
    upcomingBookings: data?.upcomingBookings ?? [],
    utilization: data?.utilization ?? 0,
    isLoading,
    error: error ? 'Failed to load data' : null
  };
}
