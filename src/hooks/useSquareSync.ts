
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncStatus {
  environment: string;
  sync_status: string;
  last_successful_sync: string | null;
  last_sync_attempt: string | null;
  payments_synced: number | null;
  error_message: string | null;
}

export const useSquareSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('square_sync_status')
        .select('*')
        .order('environment');

      if (error) throw error;
      setSyncStatus(data || []);
    } catch (error) {
      console.error('Error fetching sync status:', error);
      toast.error('Failed to fetch sync status');
    }
  }, []);

  const triggerSync = useCallback(async (environment: 'sandbox' | 'production' = 'sandbox') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('square-sync', {
        body: { environment }
      });

      if (error) throw error;

      toast.success(`Square sync completed for ${environment}`, {
        description: `Processed ${data.paymentsProcessed} payments`
      });

      // Refresh sync status after successful sync
      await fetchSyncStatus();
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to trigger Square sync');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus]);

  const getFormattedSyncStatus = useCallback((status: SyncStatus) => {
    const lastSync = status.last_successful_sync 
      ? new Date(status.last_successful_sync).toLocaleString()
      : 'Never';
    
    const lastAttempt = status.last_sync_attempt
      ? new Date(status.last_sync_attempt).toLocaleString()
      : 'Never';

    return {
      ...status,
      lastSyncFormatted: lastSync,
      lastAttemptFormatted: lastAttempt
    };
  }, []);

  return {
    isLoading,
    syncStatus,
    fetchSyncStatus,
    triggerSync,
    getFormattedSyncStatus
  };
};
