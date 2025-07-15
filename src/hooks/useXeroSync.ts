import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface XeroSyncStatus {
  environment: string;
  sync_status: string;
  last_successful_sync: string | null;
  last_sync_attempt: string | null;
  accounts_synced?: number | null;
  reports_synced?: number | null;
  progress_percentage: number | null;
  error_message: string | null;
  sync_session_id: string | null;
  last_heartbeat: string | null;
  // Additional fields from square_sync_status table
  payments_synced?: number | null;
  payments_fetched?: number | null;
  current_date_range_start?: string | null;
  current_date_range_end?: string | null;
  cursor_position?: string | null;
  is_continuation?: boolean | null;
  total_estimated?: number | null;
  created_at?: string;
  updated_at?: string;
  id?: string;
}

interface XeroSyncResult {
  success: boolean;
  message: string;
  stats: {
    accounts_processed: number;
    reports_processed: number;
    execution_time_ms: number;
  };
  timestamp: string;
  error?: string;
}

export const useXeroSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<XeroSyncStatus[]>([]);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('square_sync_status') // Reusing existing table with xero_ prefix
        .select('*')
        .like('environment', 'xero_%')
        .order('environment');

      if (error) throw error;
      
      // Transform to remove xero_ prefix for display
      const xeroData = (data || []).map(item => ({
        ...item,
        environment: item.environment.replace('xero_', '')
      }));
      
      setSyncStatus(xeroData);
    } catch (error) {
      console.error('Error fetching Xero sync status:', error);
      toast.error('Failed to fetch Xero sync status');
    }
  }, []);

  const triggerSync = useCallback(async (
    environment: 'sandbox' | 'production' = 'production',
    options?: {
      syncType?: 'full' | 'accounts' | 'reports';
    }
  ) => {
    setIsLoading(true);
    try {
      const requestBody = { 
        environment,
        syncType: options?.syncType || 'full'
      };

      console.log('🚀 Triggering Xero sync with params:', {
        ...requestBody,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase.functions.invoke('xero-sync', {
        body: requestBody
      });

      if (error) {
        console.error('Supabase function invoke error:', error);
        throw error;
      }

      const result = data as XeroSyncResult;
      console.log('📊 Xero sync result received:', result);

      if (result.success) {
        toast.success(`Xero ${environment} sync completed successfully`, {
          description: `Processed ${result.stats.accounts_processed} accounts and ${result.stats.reports_processed} reports in ${Math.round(result.stats.execution_time_ms / 1000)}s`
        });
      } else {
        throw new Error(result.error || 'Xero sync failed');
      }

      // Refresh sync status after sync
      await fetchSyncStatus();
      
      return result;
    } catch (error) {
      console.error('Xero sync error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      toast.error('Xero sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus]);

  const syncAccounts = useCallback(async (environment: 'sandbox' | 'production') => {
    console.log('📋 Syncing Xero accounts only:', { environment });
    return triggerSync(environment, { syncType: 'accounts' });
  }, [triggerSync]);

  const syncReports = useCallback(async (environment: 'sandbox' | 'production') => {
    console.log('📊 Syncing Xero reports only:', { environment });
    return triggerSync(environment, { syncType: 'reports' });
  }, [triggerSync]);

  const getFormattedSyncStatus = useCallback((status: XeroSyncStatus) => {
    const lastSync = status.last_successful_sync 
      ? new Date(status.last_successful_sync).toLocaleString()
      : 'Never';
    
    const lastAttempt = status.last_sync_attempt
      ? new Date(status.last_sync_attempt).toLocaleString()
      : 'Never';

    const lastHeartbeat = status.last_heartbeat
      ? new Date(status.last_heartbeat).toLocaleString()
      : 'Never';

    return {
      ...status,
      lastSyncFormatted: lastSync,
      lastAttemptFormatted: lastAttempt,
      lastHeartbeatFormatted: lastHeartbeat,
      progressText: status.progress_percentage ? `${status.progress_percentage}%` : 'Unknown'
    };
  }, []);

  return {
    isLoading,
    syncStatus,
    fetchSyncStatus,
    triggerSync,
    syncAccounts,
    syncReports,
    getFormattedSyncStatus
  };
};