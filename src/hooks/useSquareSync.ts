import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncStatus {
  environment: string;
  sync_status: string;
  last_successful_sync: string | null;
  last_sync_attempt: string | null;
  payments_synced: number | null;
  payments_fetched: number | null;
  progress_percentage: number | null;
  error_message: string | null;
  sync_session_id: string | null;
  cursor_position: string | null;
  is_continuation: boolean | null;
  last_heartbeat: string | null;
  total_estimated: number | null;
}

interface SyncResult {
  success: boolean;
  environment: string;
  paymentsProcessed: number;
  totalFetched: number;
  cursor: string | null;
  isComplete: boolean;
  executionTimeSeconds: number;
  sessionId: string | null;
  canContinue: boolean;
  progressPercentage: number;
  message: string;
  error?: string;
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

  const triggerSync = useCallback(async (
    environment: 'sandbox' | 'production' = 'sandbox',
    options?: {
      historical?: boolean;
      dateRange?: { start: string; end: string };
      clearExisting?: boolean;
    }
  ) => {
    setIsLoading(true);
    try {
      const requestBody: any = { 
        environment,
        ...options
      };

      console.log('🚀 Triggering cursor-based sync with detailed params:', {
        environment,
        ...options,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase.functions.invoke('square-sync', {
        body: requestBody
      });

      if (error) {
        console.error('Supabase function invoke error:', error);
        throw error;
      }

      const result = data as SyncResult;
      console.log('📊 Sync result received:', result);

      if (result.success) {
        if (result.isComplete) {
          toast.success(`${environment} sync completed successfully`, {
            description: `Processed ${result.paymentsProcessed} payments in ${result.executionTimeSeconds}s`
          });
        } else {
          toast.success(`${environment} sync partially completed`, {
            description: `Processed ${result.paymentsProcessed} payments. ${result.progressPercentage}% complete. Session ${result.sessionId} can be continued.`
          });
        }
      } else {
        throw new Error(result.error || 'Sync failed');
      }

      // Refresh sync status after sync
      await fetchSyncStatus();
      
      return result;
    } catch (error) {
      console.error('Sync error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus]);

  const testDateRangeSync = useCallback(async (
    environment: 'sandbox' | 'production',
    startDate: string,
    endDate: string,
    clearExisting = false
  ) => {
    console.log('🔍 Testing specific date range sync:', {
      environment,
      startDate,
      endDate,
      clearExisting,
      startDateParsed: new Date(startDate).toISOString(),
      endDateParsed: new Date(endDate).toISOString()
    });

    return triggerSync(environment, {
      dateRange: { start: startDate, end: endDate },
      clearExisting
    });
  }, [triggerSync]);

  const syncLastDays = useCallback(async (
    environment: 'sandbox' | 'production',
    days: number,
    clearExisting = false
  ) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('📅 Syncing last', days, 'days:', {
      environment,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      clearExisting
    });

    return testDateRangeSync(
      environment,
      startDate.toISOString(),
      endDate.toISOString(),
      clearExisting
    );
  }, [testDateRangeSync]);

  const continueSync = useCallback(async (
    environment: 'sandbox' | 'production',
    sessionId: string
  ) => {
    setIsLoading(true);
    try {
      console.log(`Continuing sync session ${sessionId} for ${environment}`);

      const { data, error } = await supabase.functions.invoke('square-sync', {
        body: { 
          environment,
          continue_session: sessionId
        }
      });

      if (error) throw error;

      const result = data as SyncResult;

      if (result.success) {
        if (result.isComplete) {
          toast.success(`${environment} sync completed`, {
            description: `Total processed: ${result.paymentsProcessed} payments`
          });
        } else {
          toast.success(`${environment} sync continued`, {
            description: `Processed ${result.paymentsProcessed} payments so far. ${result.progressPercentage}% complete.`
          });
        }
      } else {
        throw new Error(result.error || 'Continue sync failed');
      }

      // Refresh sync status
      await fetchSyncStatus();
      
      return result;
    } catch (error) {
      console.error('Continue sync error:', error);
      toast.error('Failed to continue sync', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus]);

  const resetSyncSession = useCallback(async (environment: 'sandbox' | 'production') => {
    try {
      await supabase
        .from('square_sync_status')
        .update({
          sync_status: 'pending',
          sync_session_id: null,
          cursor_position: null,
          is_continuation: false,
          progress_percentage: 0,
          error_message: null
        })
        .eq('environment', environment);

      toast.success(`${environment} sync session reset`);
      await fetchSyncStatus();
    } catch (error) {
      console.error('Reset sync session error:', error);
      toast.error('Failed to reset sync session');
    }
  }, [fetchSyncStatus]);

  const getFormattedSyncStatus = useCallback((status: SyncStatus) => {
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
      canContinue: status.sync_session_id && status.cursor_position && status.sync_status === 'partial',
      progressText: status.progress_percentage ? `${status.progress_percentage}%` : 'Unknown'
    };
  }, []);

  return {
    isLoading,
    syncStatus,
    fetchSyncStatus,
    triggerSync,
    testDateRangeSync,
    syncLastDays,
    continueSync,
    resetSyncSession,
    getFormattedSyncStatus
  };
};
