import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  RefreshCw, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Bug
} from 'lucide-react';
import { useXeroSync } from '@/hooks/useXeroSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const XeroSyncControls = () => {
  const {
    isLoading,
    syncStatus,
    fetchSyncStatus,
    triggerSync,
    syncAccounts,
    syncReports,
    getFormattedSyncStatus
  } = useXeroSync();

  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('production');
  const [isDebugging, setIsDebugging] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleDebugTest = async (testType: string) => {
    setIsDebugging(true);
    try {
      const { data, error } = await supabase.functions.invoke('xero-debug-test', {
        body: {
          test_type: testType,
          environment
        }
      });

      if (error) throw error;

      console.log('Debug test result:', data);
      
      if (data.success) {
        toast.success(`Debug test "${testType}" completed successfully - check console for details`);
      } else {
        toast.error(`Debug test "${testType}" failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Debug test error:', error);
      toast.error(`Debug test failed: ${error.message}`);
    } finally {
      setIsDebugging(false);
    }
  };

  const currentStatus = syncStatus.find(s => s.environment === environment);
  const formattedStatus = currentStatus ? getFormattedSyncStatus(currentStatus) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Environment:</span>
        <div className="flex space-x-2">
          <Button
            variant={environment === 'production' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEnvironment('production')}
          >
            Production
          </Button>
          <Button
            variant={environment === 'sandbox' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEnvironment('sandbox')}
          >
            Sandbox
          </Button>
        </div>
      </div>

      {/* Sync Status Card */}
      {formattedStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                {getStatusIcon(formattedStatus.sync_status)}
                <span>Xero {environment} Sync Status</span>
              </span>
              <Badge className={getStatusColor(formattedStatus.sync_status)}>
                {formattedStatus.sync_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Last Successful Sync:</span>
                <p className="text-gm-neutral-600">{formattedStatus.lastSyncFormatted}</p>
              </div>
              <div>
                <span className="font-medium">Last Attempt:</span>
                <p className="text-gm-neutral-600">{formattedStatus.lastAttemptFormatted}</p>
              </div>
              {formattedStatus.accounts_synced !== null && (
                <div>
                  <span className="font-medium">Accounts Synced:</span>
                  <p className="text-gm-neutral-600">{formattedStatus.accounts_synced}</p>
                </div>
              )}
              {formattedStatus.reports_synced !== null && (
                <div>
                  <span className="font-medium">Reports Processed:</span>
                  <p className="text-gm-neutral-600">{formattedStatus.reports_synced}</p>
                </div>
              )}
            </div>

            {formattedStatus.error_message && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {formattedStatus.error_message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Xero Data Sync</span>
          </CardTitle>
          <CardDescription>
            Sync your Xero chart of accounts and profit & loss reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Sync */}
          <div className="space-y-2">
            <h4 className="font-medium">Full Sync</h4>
            <p className="text-sm text-gm-neutral-600">
              Sync both chart of accounts and P&L reports (recommended)
            </p>
            <Button
              onClick={() => triggerSync(environment)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Full Sync
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Partial Sync Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Partial Sync Options</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => syncAccounts(environment)}
                disabled={isLoading}
                className="h-auto flex-col items-start p-4"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Accounts Only</span>
                </div>
                <span className="text-xs text-gm-neutral-600">
                  Sync chart of accounts
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => syncReports(environment)}
                disabled={isLoading}
                className="h-auto flex-col items-start p-4"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Reports Only</span>
                </div>
                <span className="text-xs text-gm-neutral-600">
                  Sync P&L reports
                </span>
              </Button>
            </div>
          </div>

          {/* Debug Tools */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium text-orange-600">🔧 Debug Tools</h4>
            <p className="text-xs text-gm-neutral-600">
              Use these tools to diagnose connection issues. Check browser console for detailed logs.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => handleDebugTest('database_check')} 
                disabled={isDebugging}
                variant="outline"
                size="sm"
              >
                <Bug className="h-3 w-3 mr-1" />
                DB Check
              </Button>
              <Button 
                onClick={() => handleDebugTest('token_check')} 
                disabled={isDebugging}
                variant="outline"
                size="sm"
              >
                <Bug className="h-3 w-3 mr-1" />
                Token Check
              </Button>
              <Button 
                onClick={() => handleDebugTest('direct_api')} 
                disabled={isDebugging}
                variant="outline"
                size="sm"
              >
                <Bug className="h-3 w-3 mr-1" />
                Direct API
              </Button>
              <Button 
                onClick={() => handleDebugTest('proxy_test')} 
                disabled={isDebugging}
                variant="outline"
                size="sm"
              >
                <Bug className="h-3 w-3 mr-1" />
                Proxy Test
              </Button>
            </div>
          </div>

          {/* Refresh Status */}
          <Separator />
          <Button
            variant="ghost"
            onClick={fetchSyncStatus}
            disabled={isLoading}
            className="w-full"
          >
            <Clock className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Xero sync requires an active OAuth connection. 
          Make sure you've connected your Xero account in the API settings first.
        </AlertDescription>
      </Alert>
    </div>
  );
};