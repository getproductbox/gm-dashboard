
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Hash, RefreshCw, CheckCircle, AlertCircle, PlayCircle, MapPin } from 'lucide-react';
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
  const { syncTransactions, continueSync, isLoading } = useSquareSync();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [transactionCount, setTransactionCount] = useState<string>('500');
  const [clearExisting, setClearExisting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const locations = [
    { id: 'LGRBM02D8PCNM', name: 'Hippie Door' },
    { id: 'LZJH98CYNZ8JF', name: 'Hippie Bar' },
    { id: 'LB2CG4JE73AJN', name: 'Manor Bar' }
  ];

  const handleTransactionSync = async (environment: 'sandbox' | 'production') => {
    setSyncResult(null);
    
    try {
      console.log(`Starting transaction-based sync for ${environment} environment...`);
      console.log('Transaction limit:', transactionCount);
      console.log('Clear existing:', clearExisting);
      
      const result = await syncTransactions(environment, parseInt(transactionCount), clearExisting);
      setSyncResult(result);
      
    } catch (error) {
      console.error('Transaction sync error:', error);
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

  const handleLocationSync = async (environment: 'sandbox' | 'production') => {
    if (!selectedLocation) return;
    
    setSyncResult(null);
    
    try {
      console.log(`Starting location-specific sync for ${environment} environment...`);
      console.log('Location:', selectedLocation);
      console.log('Clear existing:', clearExisting);
      
      const result = await syncTransactions(environment, 1000, clearExisting, selectedLocation);
      setSyncResult(result);
      
    } catch (error) {
      console.error('Location sync error:', error);
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
        message: 'Location sync failed'
      });
    }
  };

  const selectedLocationName = locations.find(loc => loc.id === selectedLocation)?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Hash className="h-5 w-5" />
          <span>Transaction-Based Payment Sync</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Sync a specific number of transactions instead of time-based ranges. This approach avoids 
            timeouts and provides predictable execution times, even for high-volume transaction days.
          </AlertDescription>
        </Alert>

        {/* Transaction Count Selection */}
        <div className="space-y-2">
          <Label htmlFor="transaction-count">Number of Transactions to Sync</Label>
          <Select value={transactionCount} onValueChange={setTransactionCount}>
            <SelectTrigger>
              <SelectValue placeholder="Select transaction count" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="250">250 transactions (Quick test)</SelectItem>
              <SelectItem value="500">500 transactions (Recommended)</SelectItem>
              <SelectItem value="1000">1,000 transactions (Medium test)</SelectItem>
              <SelectItem value="2000">2,000 transactions (Large test)</SelectItem>
              <SelectItem value="10000">10,000 transactions (Stress test)</SelectItem>
              <SelectItem value="50000">50,000 transactions (Max stress test)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600">
            Estimated time: {parseInt(transactionCount) <= 500 ? '30-60 seconds' : 
                           parseInt(transactionCount) <= 1000 ? '1-2 minutes' : 
                           parseInt(transactionCount) <= 2000 ? '2-4 minutes' : 
                           parseInt(transactionCount) <= 10000 ? '2-5 minutes' : '5-10 minutes'}
            {parseInt(transactionCount) >= 10000 && (
              <span className="block text-orange-600 mt-1">
                ⚡ Stress test: ~{Math.ceil(parseInt(transactionCount) / 100)} API calls to Square for comprehensive dataset
              </span>
            )}
          </p>
        </div>

        {/* Clear Existing Data Option */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="clear-existing"
            checked={clearExisting}
            onCheckedChange={(checked) => setClearExisting(checked as boolean)}
          />
          <Label htmlFor="clear-existing" className="text-sm">
            Clear existing data before sync
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => handleTransactionSync('sandbox')}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Hash className="h-4 w-4 mr-2" />
            )}
            Test Sandbox ({transactionCount} transactions)
          </Button>

          <Button
            onClick={() => handleTransactionSync('production')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Hash className="h-4 w-4 mr-2" />
            )}
            Sync Production ({transactionCount} transactions)
          </Button>
        </div>

        {/* Location-Specific Testing Section */}
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <strong>Location-Specific Testing:</strong> Sync 1,000 transactions from a specific venue. 
            This is perfect for testing venue mapping and getting focused data from a single location.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="location-select">Select Location for Testing</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} ({location.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedLocationName && (
            <p className="text-xs text-muted-foreground">
              Will sync 1,000 most recent transactions from <strong>{selectedLocationName}</strong>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => handleLocationSync('sandbox')}
            disabled={isLoading || !selectedLocation}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            Test {selectedLocationName || 'Location'} (Sandbox)
          </Button>

          <Button
            onClick={() => handleLocationSync('production')}
            disabled={isLoading || !selectedLocation}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            Sync {selectedLocationName || 'Location'} (Production)
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
                <span>Transaction Sync Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 flex-wrap text-sm">
                    <Badge variant="outline">{syncResult.environment}</Badge>
                    <span><strong>Fetched:</strong> {syncResult.totalFetched} transactions</span>
                    <span><strong>Processed:</strong> {syncResult.paymentsProcessed} payments</span>
                    <span><strong>Time:</strong> {syncResult.executionTimeSeconds}s</span>
                    {!syncResult.isComplete && (
                      <Badge variant="secondary">Partial</Badge>
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

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Next steps after sync:</strong> Once transactions are synced, use the "Map ALL Transactions" 
            test on the Data Mapping tab to process the new payment data and test venue mapping.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
