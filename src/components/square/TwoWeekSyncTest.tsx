
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useSquareSync } from '@/hooks/useSquareSync';

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

export const TwoWeekSyncTest = () => {
  const { syncLastDays, isLoading } = useSquareSync();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleTwoWeekSync = async (environment: 'sandbox' | 'production') => {
    setSyncResult(null);
    
    try {
      console.log(`Starting 2-week sync for ${environment} environment...`);
      
      const result = await syncLastDays(environment, 14, false); // Last 14 days, don't clear existing
      setSyncResult(result);
      
    } catch (error) {
      console.error('Two-week sync error:', error);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5" />
          <span>2-Week Payment Sync Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This will sync payments from the last 14 days to populate the square_payments_raw table 
            with fresh data for testing venue mapping.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => handleTwoWeekSync('sandbox')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4 mr-2" />
            )}
            Test Sandbox (2 weeks)
          </Button>

          <Button
            onClick={() => handleTwoWeekSync('production')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4 mr-2" />
            )}
            Sync Production (2 weeks)
          </Button>
        </div>

        {syncResult && (
          <Card className={syncResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-sm">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span>2-Week Sync Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 flex-wrap text-sm">
                    <Badge variant="outline">{syncResult.environment}</Badge>
                    <span><strong>Processed:</strong> {syncResult.paymentsProcessed} payments</span>
                    <span><strong>Fetched:</strong> {syncResult.totalFetched} payments</span>
                    <span><strong>Time:</strong> {syncResult.executionTimeSeconds}s</span>
                  </div>
                  
                  <p className="text-sm text-green-700">{syncResult.message}</p>
                  
                  {syncResult.progressPercentage > 0 && (
                    <div className="text-xs text-gray-600">
                      Progress: {syncResult.progressPercentage}%
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

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Next steps after sync:</strong> Once payments are synced, use the "Map ALL Transactions" 
            test on the Data Mapping tab to process the new payment data and test venue mapping.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
