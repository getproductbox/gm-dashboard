import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type ProfitLossEvent = Tables<'profit_loss_events'>;

export const useSimpleProfitLoss = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ProfitLossEvent[]>([]);

  const fetchData = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profit_loss_events')
        .select('*')
        .order('report_date', { ascending: false });

      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      if (endDate) {
        query = query.lte('period_end', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setData(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching P&L data:', error);
      toast.error('Failed to fetch profit & loss data');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    data,
    fetchData
  };
};