
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';

export const SquareSyncDashboard = () => {
  const { isLoading, syncStatus, fetchSyncStatus, triggerSync, getFormattedSyncStatus } = useSquareSync();

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
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
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gm-neutral-900">Square Sync Dashboard</h2>
          <p className="text-gm-neutral-600">Monitor and manage Square API data synchronization</p>
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
                    <p className="font-medium text-gm-neutral-700">Environment</p>
                    <p className="text-gm-neutral-600 capitalize">{status.environment}</p>
                  </div>
                </div>

                {status.error_message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{status.error_message}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => triggerSync(status.environment as 'sandbox' | 'production')}
                  disabled={isLoading || status.sync_status === 'running'}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Trigger Sync
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gm-neutral-600">
            <p>• Automated syncing runs every 15 minutes during business hours (9 AM - 11 PM)</p>
            <p>• Manual sync can be triggered at any time using the buttons above</p>
            <p>• Raw Square API responses are stored for audit and debugging purposes</p>
            <p>• Payments are automatically categorized into bar, door, and other revenue types</p>
            <p>• Sync status is tracked separately for sandbox and production environments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
