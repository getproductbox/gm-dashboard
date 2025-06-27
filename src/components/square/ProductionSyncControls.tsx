
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Server, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Trash2,
  PlayCircle,
  RefreshCw
} from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';
import { toast } from 'sonner';

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

export const ProductionSyncControls = () => {
  const { triggerSync, continueSync, isLoading } = useSquareSync();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  const handleSync = async (
    syncType: 'incremental' | 'historical' | 'last-year', 
    environment: 'sandbox' | 'production' = 'production'
  ) => {
    setSyncResult(null);

    try {
      let options: any = {
        clearExisting
      };

      switch (syncType) {
        case 'historical':
          options.dateRange = {
            start: new Date(dateRange.start).toISOString(),
            end: new Date(dateRange.end + 'T23:59:59').toISOString()
          };
          break;
        case 'last-year':
          options.historical = true;
          break;
        case 'incremental':
          // No additional parameters needed
          break;
      }

      console.log('Triggering cursor-based sync with params:', { environment, ...options });

      const result = await triggerSync(environment, options);
      setSyncResult(result);

    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        environment,
        paymentsProcessed: 0,
        totalFetched: 0,
        cursor: null,
        isComplete: false,
        executionTimeSeconds: 0,
        sessionId: null,
        canContinue: false,
        progressPercentage: 0,
        message: 'Sync failed'
      });
    }
  };

  const handleContinueSync = async (environment: 'sandbox' | 'production') => {
    if (!syncResult?.sessionId) return;
    
    try {
      const result = await continueSync(environment, syncResult.sessionId);
      setSyncResult(result);
    } catch (error) {
      console.error('Continue sync error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <strong>Production Environment:</strong> These controls will sync real payment data from your production Square account. 
          The new cursor-based system can handle high-volume single-day transactions efficiently.
        </AlertDescription>
      </Alert>

      {/* Clear Data Option */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Trash2 className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="clear-existing"
              checked={clearExisting}
              onCheckedChange={(checked) => setClearExisting(checked as boolean)}
            />
            <Label htmlFor="clear-existing" className="text-sm">
              Clear existing test data before sync (recommended for testing)
            </Label>
          </div>
          <p className="text-xs text-orange-600 mt-2">
            This will remove all existing payments from both raw and processed tables before starting the sync.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production">Production Sync</TabsTrigger>
          <TabsTrigger value="sandbox">Sandbox Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <Server className="h-5 w-5" />
                <span>Production Square Sync</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleSync('incremental', 'production')}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Incremental Sync</span>
                </Button>

                <Button
                  onClick={() => handleSync('last-year', 'production')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Last Year</span>
                </Button>

                <Button
                  onClick={() => handleSync('historical', 'production')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Custom Range</span>
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Historical Sync Date Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sandbox" className="space-y-4">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Server className="h-5 w-5" />
                <span>Sandbox Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleSync('incremental', 'sandbox')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Test Incremental</span>
                </Button>

                <Button
                  onClick={() => handleSync('last-year', 'sandbox')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Test Historical</span>
                </Button>

                <Button
                  onClick={() => handleSync('historical', 'sandbox')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Test Custom Range</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sync Results */}
      {syncResult && (
        <Card className={syncResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {syncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Cursor-Based Sync Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncResult.success ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                {syncResult.progressPercentage > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{syncResult.progressPercentage}%</span>
                    </div>
                    <Progress value={syncResult.progressPercentage} className="h-2" />
                  </div>
                )}

                <div className="flex items-center space-x-4 flex-wrap">
                  <Badge variant="outline">{syncResult.environment}</Badge>
                  <span className="text-sm">
                    <strong>Processed:</strong> {syncResult.paymentsProcessed} payments
                  </span>
                  <span className="text-sm">
                    <strong>Total Fetched:</strong> {syncResult.totalFetched} payments
                  </span>
                  <span className="text-sm">
                    <strong>Time:</strong> {syncResult.executionTimeSeconds}s
                  </span>
                  {!syncResult.isComplete && (
                    <Badge variant="secondary">Partial Sync</Badge>
                  )}
                </div>
                
                <p className="text-sm text-green-700">{syncResult.message}</p>
                
                {syncResult.canContinue && syncResult.sessionId && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      onClick={() => handleContinueSync(syncResult.environment as 'sandbox' | 'production')}
                      disabled={isLoading}
                      size="sm"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continue Sync
                    </Button>
                    <span className="text-xs text-gray-600">
                      Session: {syncResult.sessionId}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {syncResult.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-blue-700">
                Processing cursor-based sync... This can handle high-volume single-day transactions efficiently.
                {clearExisting && " Clearing existing data first..."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
