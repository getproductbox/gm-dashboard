
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Play, Clock, CheckCircle, XCircle, Eye, AlertTriangle, PlayCircle, RotateCcw } from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';
import { supabase } from '@/integrations/supabase/client';

interface SyncHistoryItem {
  id: string;
  environment: string;
  sync_status: string;
  last_sync_attempt: string;
  payments_synced: number;
  payments_fetched: number;
  progress_percentage: number;
  error_message: string | null;
  sync_session_id: string | null;
  is_continuation: boolean;
  last_heartbeat: string | null;
}

export const ManualSyncControls = () => {
  const { 
    isLoading, 
    syncStatus, 
    fetchSyncStatus, 
    triggerSync, 
    continueSync, 
    resetSyncSession, 
    getFormattedSyncStatus 
  } = useSquareSync();
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [showErrorLogs, setShowErrorLogs] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
    fetchSyncHistory();
  }, [fetchSyncStatus]);

  const fetchSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('square_sync_status')
        .select('*')
        .order('last_sync_attempt', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncHistory(data || []);
    } catch (error) {
      console.error('Error fetching sync history:', error);
    }
  };

  const handleManualSync = async (environment: 'sandbox' | 'production') => {
    try {
      await triggerSync(environment);
      await fetchSyncHistory();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleContinueSync = async (environment: 'sandbox' | 'production', sessionId: string) => {
    try {
      await continueSync(environment, sessionId);
      await fetchSyncHistory();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleResetSession = async (environment: 'sandbox' | 'production') => {
    await resetSyncSession(environment);
    await fetchSyncHistory();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>Cursor-Based Sync Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Sandbox Environment</h4>
              
              {/* Progress bar for sandbox */}
              {syncStatus.find(s => s.environment === 'sandbox')?.progress_percentage && (
                <div className="space-y-1">
                  <Progress 
                    value={syncStatus.find(s => s.environment === 'sandbox')?.progress_percentage || 0} 
                    className="h-2" 
                  />
                  <div className="text-xs text-gray-500">
                    {syncStatus.find(s => s.environment === 'sandbox')?.progress_percentage}% complete
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {syncStatus.find(s => s.environment === 'sandbox')?.sync_session_id && 
                 syncStatus.find(s => s.environment === 'sandbox')?.sync_status === 'partial' ? (
                  <Button
                    onClick={() => handleContinueSync('sandbox', syncStatus.find(s => s.environment === 'sandbox')?.sync_session_id!)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleManualSync('sandbox')}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    Sync Now
                  </Button>
                )}
                
                {(syncStatus.find(s => s.environment === 'sandbox')?.sync_status === 'partial' || 
                  syncStatus.find(s => s.environment === 'sandbox')?.sync_status === 'error') && (
                  <Button
                    onClick={() => handleResetSession('sandbox')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {syncStatus.find(s => s.environment === 'sandbox') && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Last sync: {getFormattedSyncStatus(syncStatus.find(s => s.environment === 'sandbox')!).lastSyncFormatted}</div>
                  <div>Synced: {syncStatus.find(s => s.environment === 'sandbox')?.payments_synced || 0} payments</div>
                  {syncStatus.find(s => s.environment === 'sandbox')?.payments_fetched && (
                    <div>Fetched: {syncStatus.find(s => s.environment === 'sandbox')?.payments_fetched} payments</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Production Environment</h4>
              
              {/* Progress bar for production */}
              {syncStatus.find(s => s.environment === 'production')?.progress_percentage && (
                <div className="space-y-1">
                  <Progress 
                    value={syncStatus.find(s => s.environment === 'production')?.progress_percentage || 0} 
                    className="h-2" 
                  />
                  <div className="text-xs text-gray-500">
                    {syncStatus.find(s => s.environment === 'production')?.progress_percentage}% complete
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {syncStatus.find(s => s.environment === 'production')?.sync_session_id && 
                 syncStatus.find(s => s.environment === 'production')?.sync_status === 'partial' ? (
                  <Button
                    onClick={() => handleContinueSync('production', syncStatus.find(s => s.environment === 'production')?.sync_session_id!)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleManualSync('production')}
                    disabled={isLoading}
                    className="flex-1"
                    variant="outline"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    Sync Now
                  </Button>
                )}

                {(syncStatus.find(s => s.environment === 'production')?.sync_status === 'partial' || 
                  syncStatus.find(s => s.environment === 'production')?.sync_status === 'error') && (
                  <Button
                    onClick={() => handleResetSession('production')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {syncStatus.find(s => s.environment === 'production') && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Last sync: {getFormattedSyncStatus(syncStatus.find(s => s.environment === 'production')!).lastSyncFormatted}</div>
                  <div>Synced: {syncStatus.find(s => s.environment === 'production')?.payments_synced || 0} payments</div>
                  {syncStatus.find(s => s.environment === 'production')?.payments_fetched && (
                    <div>Fetched: {syncStatus.find(s => s.environment === 'production')?.payments_fetched} payments</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Sync History</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowErrorLogs(!showErrorLogs)}>
              <Eye className="h-4 w-4 mr-2" />
              {showErrorLogs ? 'Hide' : 'Show'} Error Details
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {syncHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.sync_status)}
                  <div>
                    <div className="font-medium capitalize">{item.environment}</div>
                    <div className="text-sm text-gray-500">
                      {item.last_sync_attempt ? new Date(item.last_sync_attempt).toLocaleString() : 'Never'}
                    </div>
                    {item.is_continuation && (
                      <Badge variant="outline" className="text-xs">Continuation</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={item.sync_status === 'success' ? 'default' : item.sync_status === 'partial' ? 'secondary' : 'destructive'}>
                    {item.sync_status}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {item.payments_synced || 0} synced
                  </div>
                  {item.payments_fetched && (
                    <div className="text-xs text-gray-400">
                      {item.payments_fetched} fetched
                    </div>
                  )}
                  {item.progress_percentage && (
                    <div className="text-xs text-gray-400">
                      {item.progress_percentage}% complete
                    </div>
                  )}
                </div>
                {showErrorLogs && item.error_message && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{item.error_message}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
            {syncHistory.length === 0 && (
              <div className="text-center text-gray-500 py-8">No sync history available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
