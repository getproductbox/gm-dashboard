import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';
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

export const BackfillManager = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState<BackfillProgress | null>(null);
  const [summary, setSummary] = useState<BackfillSummary | null>(null);
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
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

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

  const handleStartBackfill = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(null);
    setSummary(null);
    setStatus('running');

    try {
      const backfillParams = {
        start_date: startDate || defaultDates.start,
        end_date: endDate || defaultDates.end,
        dry_run: isDryRun
      };

      console.log('Starting backfill with params:', backfillParams);

      const { data, error } = await supabase.functions.invoke('square-sync-backfill', {
        body: backfillParams
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setProgress(data.progress);
        setSummary(data.summary);
        setStatus(data.progress.errors.length > 0 ? 'completed_with_errors' : 'completed');
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }

    } catch (err) {
      console.error('Backfill error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleTransformData = async () => {
    setIsTransforming(true);
    setError(null);
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
      setStatus('transform_completed');

    } catch (err) {
      console.error('Transform error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('error');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all existing data? This action cannot be undone.')) {
      return;
    }

    try {
      setStatus('clearing');
      
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
      setStatus('idle');
      setProgress(null);
      setSummary(null);
      setError(null);

    } catch (err) {
      console.error('Clear data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      setStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed_with_errors':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'transform_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'clearing':
        return <Database className="h-4 w-4 animate-spin" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Backfill in progress...';
      case 'completed':
        return 'Backfill completed successfully';
      case 'completed_with_errors':
        return 'Backfill completed with some errors';
      case 'transform_completed':
        return 'Transform completed successfully';
      case 'error':
        return 'Backfill failed';
      case 'clearing':
        return 'Clearing data...';
      default:
        return 'Ready to start backfill';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Backfill Manager
        </CardTitle>
        <CardDescription>
          Backfill historical Square payment data. This process will fetch data month by month to avoid overwhelming the API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
          {status === 'running' && progress && (
            <Badge variant="secondary">
              {progress.completed_requests} / {progress.total_requests} months
            </Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Display */}
        {progress && status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing: {progress.current_date}</span>
              <span>{progress.completed_requests} / {progress.total_requests} months</span>
            </div>
            <Progress value={(progress.completed_requests / progress.total_requests) * 100} />
            <div className="text-sm text-muted-foreground">
              Payments fetched: {progress.total_payments_fetched.toLocaleString()} | 
              Payments synced: {progress.total_payments_synced.toLocaleString()}
            </div>
          </div>
        )}

        {/* Summary Display */}
        {summary && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Backfill Summary:</strong></div>
                <div>• Months processed: {summary.months_processed}</div>
                <div>• Total payments fetched: {summary.total_payments_fetched.toLocaleString()}</div>
                <div>• Total payments synced: {summary.total_payments_synced.toLocaleString()}</div>
                <div>• Date range: {summary.date_range.start_date} to {summary.date_range.end_date}</div>
                {summary.errors_count > 0 && (
                  <div className="text-yellow-600">• Errors: {summary.errors_count}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

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
            onClick={handleStartBackfill}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Running...' : `Start ${isDryRun ? 'Dry Run' : 'Backfill'}`}
          </Button>
          
          <Button
            onClick={handleTransformData}
            disabled={isTransforming || !summary || status === 'running'}
            variant="secondary"
          >
            {isTransforming ? 'Transforming...' : 'Transform Data'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearData}
            disabled={isRunning || isTransforming || status === 'clearing'}
          >
            Clear Data
          </Button>
        </div>

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This process will fetch data from Square API month by month. 
            It may take several minutes to complete depending on the amount of data. 
            Consider running a dry run first to see what data would be fetched.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}; 