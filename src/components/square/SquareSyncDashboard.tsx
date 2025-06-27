import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, AlertTriangle, PlayCircle, RotateCcw } from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';
import { SquareSyncDebugControls } from './SquareSyncDebugControls';

export const SquareSyncDashboard = () => {
  const { 
    isLoading, 
    syncStatus, 
    fetchSyncStatus, 
    triggerSync, 
    continueSync, 
    resetSyncSession, 
    getFormattedSyncStatus 
  } = useSquareSync();

  useEffect(() => {
    fetchSyncStatus();
    
    // Auto-refresh every 10 seconds if there's an active sync
    const interval = setInterval(() => {
      const hasRunningSync = syncStatus.some(s => s.sync_status === 'running');
      if (hasRunningSync) {
        fetchSyncStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchSyncStatus, syncStatus]);

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
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'running':
        return 'secondary';
      case 'partial':
        return 'outline';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleContinueSync = async (environment: 'sandbox' | 'production', sessionId: string) => {
    try {
      await continueSync(environment, sessionId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gm-neutral-900">Square Sync Dashboard</h2>
          <p className="text-gm-neutral-600">Monitor and manage Square API data synchronization with cursor-based streaming</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => fetchSyncStatus()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Add Debug Controls */}
      <SquareSyncDebugControls />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {syncStatus.map((status) => {
          const formattedStatus = getFormattedSyncStatus(status);
          return (
            <Card key={status.environment}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="capitalize">{status.environment}</span>
                    {getStatusIcon(status.sync_status)}
                  </div>
                  <Badge variant={getStatusVariant(status.sync_status)}>
                    {status.sync_status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                {status.progress_percentage !== null && status.progress_percentage > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{status.progress_percentage}%</span>
                    </div>
                    <Progress value={status.progress_percentage} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gm-neutral-700">Last Successful Sync</p>
                    <p className="text-gm-neutral-600">{formattedStatus.lastSyncFormatted}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gm-neutral-700">Last Attempt</p>
                    <p className="text-gm-neutral-600">{formattedStatus.lastAttemptFormatted}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gm-neutral-700">Payments Synced</p>
                    <p className="text-gm-neutral-600">{status.payments_synced || 0}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gm-neutral-700">Payments Fetched</p>
                    <p className="text-gm-neutral-600">{status.payments_fetched || 0}</p>
                  </div>
                </div>

                {status.last_heartbeat && status.sync_status === 'running' && (
                  <div className="text-xs text-gm-neutral-500">
                    Last heartbeat: {formattedStatus.lastHeartbeatFormatted}
                  </div>
                )}

                {status.error_message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{status.error_message}</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {formattedStatus.canContinue ? (
                    <Button
                      onClick={() => handleContinueSync(status.environment as 'sandbox' | 'production', status.sync_session_id!)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continue Sync
                    </Button>
                  ) : (
                    <Button
                      onClick={() => triggerSync(status.environment as 'sandbox' | 'production')}
                      disabled={isLoading || status.sync_status === 'running'}
                      className="flex-1"
                    >
                      {isLoading || status.sync_status === 'running' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Trigger Sync
                    </Button>
                  )}

                  {(status.sync_status === 'partial' || status.sync_status === 'error') && (
                    <Button
                      onClick={() => resetSyncSession(status.environment as 'sandbox' | 'production')}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cursor-Based Sync Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gm-neutral-600">
            <p>• <strong>Streaming Processing:</strong> Payments are processed in real-time as they're fetched</p>
            <p>• <strong>Progress Tracking:</strong> Visual progress bars show sync completion percentage</p>
            <p>• <strong>Resumable Sessions:</strong> Interrupted syncs can be continued from where they left off</p>
            <p>• <strong>Timeout Protection:</strong> Long-running syncs are automatically chunked to prevent timeouts</p>
            <p>• <strong>Heartbeat Monitoring:</strong> Active syncs send periodic status updates</p>
            <p>• <strong>Error Recovery:</strong> Failed syncs can be reset and restarted safely</p>
            <p>• <strong>High Volume Support:</strong> Optimized for single-day high-volume transactions (5000+ payments)</p>
            <p>• <strong>Debug Mode:</strong> Use the debug controls above to test specific date ranges and troubleshoot sync issues</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
