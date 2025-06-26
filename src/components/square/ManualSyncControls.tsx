
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Play, Clock, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';
import { supabase } from '@/integrations/supabase/client';

interface SyncHistoryItem {
  id: string;
  environment: string;
  sync_status: string;
  last_sync_attempt: string;
  payments_synced: number;
  error_message: string | null;
}

export const ManualSyncControls = () => {
  const { isLoading, syncStatus, fetchSyncStatus, triggerSync, getFormattedSyncStatus } = useSquareSync();
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
    await triggerSync(environment);
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
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>Manual Sync Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Sandbox Environment</h4>
              <Button
                onClick={() => handleManualSync('sandbox')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Sync Sandbox Now
              </Button>
              {syncStatus.find(s => s.environment === 'sandbox') && (
                <div className="text-sm text-gray-600">
                  Last sync: {getFormattedSyncStatus(syncStatus.find(s => s.environment === 'sandbox')!).lastSyncFormatted}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Production Environment</h4>
              <Button
                onClick={() => handleManualSync('production')}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Sync Production Now
              </Button>
              {syncStatus.find(s => s.environment === 'production') && (
                <div className="text-sm text-gray-600">
                  Last sync: {getFormattedSyncStatus(syncStatus.find(s => s.environment === 'production')!).lastSyncFormatted}
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
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={item.sync_status === 'success' ? 'default' : 'destructive'}>
                    {item.sync_status}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    {item.payments_synced || 0} payments
                  </div>
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
