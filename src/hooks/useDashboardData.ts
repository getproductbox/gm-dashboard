
import { useState, useEffect } from 'react';
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

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    financials: [],
    kpis: null,
    upcomingBookings: [],
    utilization: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function loadData() {
      try {
        const today = new Date();
        const nextWeek = addDays(today, 7);
        const dateFrom = format(today, 'yyyy-MM-dd');
        const dateTo = format(nextWeek, 'yyyy-MM-dd');

        // 1. Fetch Financials
        const [financials, kpis] = await Promise.all([
          financialService.fetchWeeklyFinancials(8), // Last 8 weeks trend
          financialService.fetchKPIs(4) // Last 4 weeks KPIs
        ]);

        // 2. Fetch Upcoming Bookings
        const bookings = await bookingService.getBookings({
          dateFrom,
          dateTo,
          status: 'confirmed',
          bookingType: 'karaoke_booking' // Only karaoke for utilization, but maybe all for list? 
          // User said "bookings for the next seven days", usually implies all important ones.
          // Let's fetch ALL confirmed bookings for the list.
        });
        
        // Re-fetch just ALL confirmed bookings for the list (the previous call might have been restricted if I filtered by type)
        // Actually, let's fetch ALL bookings for the list, and filter for utilization locally.
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
          // Calculate total available hours for the next 7 days
          // Simple assumption: Open every day for now.
          // Ideally check operating_hours_start/end per booth
          
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

        setData({
          financials,
          kpis,
          upcomingBookings: allBookings.slice(0, 10), // Top 10 next bookings
          utilization,
          isLoading: false,
          error: null
        });

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setData(prev => ({ ...prev, isLoading: false, error: 'Failed to load data' }));
      }
    }

    loadData();
  }, []);

  return data;
}

