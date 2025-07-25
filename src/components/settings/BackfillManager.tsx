import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, AlertTriangle, CheckCircle, Clock, Database, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BackfillProgress {
  current_date: string;
  total_requests: number;
  completed_requests: number;
  total_payments_fetched: number;
  total_payments_synced: number;
  errors: string[];
}

interface BackfillSummary {
  months_processed: number;
  total_payments_fetched: number;
  total_payments_synced: number;
  errors_count: number;
  date_range: { start_date: string; end_date: string };
}

interface LocationBackfillStatus {
  isRunning: boolean;
  progress: BackfillProgress | null;
  summary: BackfillSummary | null;
  error: string | null;
  status: 'idle' | 'running' | 'completed' | 'completed_with_errors' | 'error';
}

export const BackfillManager = () => {
  const [isTransforming, setIsTransforming] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transformResult, setTransformResult] = useState<{
    success: boolean;
    processed_count: number;
    total_recent_synced: number;
    minutes_back: number;
    cutoff_time: string;
    sample_results: Array<{
      id: string;
      square_payment_id: string;
      venue: string;
      revenue_type: string;
      amount_cents: number;
      currency: string;
      payment_date: string;
      payment_hour: number;
      payment_day_of_week: number;
      status: string;
      processed_at: string;
      created_at: string;
      updated_at: string;
    }>;
    message: string;
  } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Individual status tracking for each location
  const [locationStatus, setLocationStatus] = useState<Record<string, LocationBackfillStatus>>({
    hippie: { isRunning: false, progress: null, summary: null, error: null, status: 'idle' },
    manor: { isRunning: false, progress: null, summary: null, error: null, status: 'idle' },
    'hippie-door': { isRunning: false, progress: null, summary: null, error: null, status: 'idle' }
  });

  // Set default dates (2 years ago to today)
  const getDefaultDates = () => {
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    
    return {
      start: twoYearsAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();

  const handleStartBackfill = async (location: string) => {
    setGlobalError(null);
    
    // Update status for this location
    setLocationStatus(prev => ({
      ...prev,
      [location]: {
        ...prev[location],
        isRunning: true,
        progress: null,
        summary: null,
        error: null,
        status: 'running'
      }
    }));

    try {
      const backfillParams = {
        start_date: startDate || defaultDates.start,
        end_date: endDate || defaultDates.end,
        dry_run: isDryRun
      };

      console.log(`Starting ${location} backfill with params:`, backfillParams);

      const functionName = `square-sync-backfill-${location}`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: backfillParams
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setLocationStatus(prev => ({
          ...prev,
          [location]: {
            ...prev[location],
            progress: data.progress,
            summary: data.summary,
            status: data.progress.errors.length > 0 ? 'completed_with_errors' : 'completed',
            isRunning: false
          }
        }));
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }

    } catch (err) {
      console.error(`${location} backfill error:`, err);
      setLocationStatus(prev => ({
        ...prev,
        [location]: {
          ...prev[location],
          error: err instanceof Error ? err.message : 'Unknown error occurred',
          status: 'error',
          isRunning: false
        }
      }));
    }
  };

  const handleTransformData = async () => {
    setIsTransforming(true);
    setGlobalError(null);
    setTransformResult(null);

    try {
      // Calculate minutes back based on the date range
      const startDateObj = new Date(startDate || defaultDates.start);
      const endDateObj = new Date(endDate || defaultDates.end);
      const now = new Date();
      
      // Use the earlier of end date or now to calculate minutes back
      const referenceDate = endDateObj < now ? endDateObj : now;
      const minutesBack = Math.ceil((referenceDate.getTime() - startDateObj.getTime()) / (1000 * 60));

      console.log('Starting transform with params:', { minutes_back: minutesBack, start_date: startDate, end_date: endDate });

      const { data, error } = await supabase.rpc('transform_recent_synced_transactions', {
        minutes_back: minutesBack
      });

      if (error) {
        throw new Error(error.message);
      }

      setTransformResult(data);

    } catch (err) {
      console.error('Transform error:', err);
      setGlobalError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all existing data? This action cannot be undone.')) {
      return;
    }

    try {
      setGlobalError(null);
      
      // Clear revenue_events first (due to foreign key constraints)
      const { error: revenueError } = await supabase
        .from('revenue_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (revenueError) {
        throw new Error(`Failed to clear revenue_events: ${revenueError.message}`);
      }

      // Clear square_payments_raw
      const { error: paymentsError } = await supabase
        .from('square_payments_raw')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (paymentsError) {
        throw new Error(`Failed to clear square_payments_raw: ${paymentsError.message}`);
      }

      alert('Data cleared successfully!');
      
      // Reset all location statuses
      setLocationStatus({
        hippie: { isRunning: false, progress: null, summary: null, error: null, status: 'idle' },
        manor: { isRunning: false, progress: null, summary: null, error: null, status: 'idle' },
        'hippie-door': { isRunning: false, progress: null, summary: null, error: null, status: 'idle' }
      });

    } catch (err) {
      console.error('Clear data error:', err);
      setGlobalError(err instanceof Error ? err.message : 'Failed to clear data');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed_with_errors':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Backfill in progress...';
      case 'completed':
        return 'Backfill completed successfully';
      case 'completed_with_errors':
        return 'Backfill completed with some errors';
      case 'error':
        return 'Backfill failed';
      default:
        return 'Ready to start backfill';
    }
  };

  const locationConfig = {
    hippie: { name: 'Hippie', color: 'bg-blue-100 text-blue-800' },
    manor: { name: 'Manor', color: 'bg-green-100 text-green-800' },
    'hippie-door': { name: 'Hippie Door', color: 'bg-purple-100 text-purple-800' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Backfill Manager
        </CardTitle>
        <CardDescription>
          Backfill historical Square payment data for each location. Each location is processed separately to avoid API limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Error Display */}
        {globalError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        {/* Location-specific Backfill Sections */}
        {Object.entries(locationConfig).map(([locationKey, config]) => {
          const status = locationStatus[locationKey];
          return (
            <div key={locationKey} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.status)}
                  <span className="font-medium">{config.name}</span>
                  <Badge className={config.color}>
                    {status.status === 'running' && status.progress 
                      ? `${status.progress.completed_requests} / ${status.progress.total_requests} months`
                      : status.status}
                  </Badge>
                </div>
                <Button
                  onClick={() => handleStartBackfill(locationKey)}
                  disabled={status.isRunning}
                  size="sm"
                >
                  {status.isRunning ? 'Running...' : `Start ${isDryRun ? 'Dry Run' : 'Backfill'}`}
                </Button>
              </div>

              {/* Location-specific Error */}
              {status.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{status.error}</AlertDescription>
                </Alert>
              )}

              {/* Location-specific Progress */}
              {status.progress && status.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing: {status.progress.current_date}</span>
                    <span>{status.progress.completed_requests} / {status.progress.total_requests} months</span>
                  </div>
                  <Progress value={(status.progress.completed_requests / status.progress.total_requests) * 100} />
                  <div className="text-sm text-muted-foreground">
                    Payments fetched: {status.progress.total_payments_fetched.toLocaleString()} | 
                    Payments synced: {status.progress.total_payments_synced.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Location-specific Summary */}
              {status.summary && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div><strong>{config.name} Summary:</strong></div>
                      <div>• Months processed: {status.summary.months_processed}</div>
                      <div>• Total payments fetched: {status.summary.total_payments_fetched.toLocaleString()}</div>
                      <div>• Total payments synced: {status.summary.total_payments_synced.toLocaleString()}</div>
                      <div>• Date range: {status.summary.date_range.start_date} to {status.summary.date_range.end_date}</div>
                      {status.summary.errors_count > 0 && (
                        <div className="text-yellow-600">• Errors: {status.summary.errors_count}</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}

        {/* Transform Result Display */}
        {transformResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Transform Summary:</strong></div>
                <div>• Raw payments found: {transformResult.total_recent_synced.toLocaleString()}</div>
                <div>• Revenue events created: {transformResult.processed_count.toLocaleString()}</div>
                <div>• Time window: Last {transformResult.minutes_back} minutes ({Math.round(transformResult.minutes_back / 60)} hours)</div>
                <div>• Cutoff time: {new Date(transformResult.cutoff_time).toLocaleString()}</div>
                {transformResult.sample_results && transformResult.sample_results.length > 0 && (
                  <div>• Sample: {transformResult.sample_results[0].venue} - ${(transformResult.sample_results[0].amount_cents / 100).toFixed(2)}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder={defaultDates.start}
            />
            <p className="text-xs text-muted-foreground">Leave empty to use 2 years ago</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder={defaultDates.end}
            />
            <p className="text-xs text-muted-foreground">Leave empty to use today</p>
          </div>
        </div>

        {/* Dry Run Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dry-run"
            checked={isDryRun}
            onCheckedChange={(checked) => setIsDryRun(checked as boolean)}
          />
          <Label htmlFor="dry-run">Dry run (don't actually insert data)</Label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTransformData}
            disabled={isTransforming || Object.values(locationStatus).every(s => s.status === 'idle')}
            variant="secondary"
            className="flex-1"
          >
            {isTransforming ? 'Transforming...' : 'Transform Data'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearData}
            disabled={Object.values(locationStatus).some(s => s.isRunning) || isTransforming}
          >
            Clear Data
          </Button>
        </div>

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Each location is processed separately to avoid API limits. 
            You can run multiple locations simultaneously. Consider running a dry run first to see what data would be fetched.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}; 