import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { MapPin, RefreshCw, CheckCircle, AlertCircle, Building, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const VenueReprocessingControls = () => {
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isSyncingLocations, setIsSyncingLocations] = useState(false);
  const [daysBack, setDaysBack] = useState("14");
  const [lastReprocessResult, setLastReprocessResult] = useState<{
    processedCount: number;
    errorCount: number;
    totalPayments: number;
    daysBack: number;
    jobId?: string;
  } | null>(null);
  const [currentJob, setCurrentJob] = useState<{
    id: string;
    status: string;
    progress_percentage: number;
    processed_count: number;
    total_payments: number;
    error_count: number;
  } | null>(null);
  const [lastLocationSyncResult, setLastLocationSyncResult] = useState<{
    locationsProcessed: number;
    environment: string;
  } | null>(null);

  // Poll for job status when there's an active job
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') {
      return;
    }

    const pollJobStatus = async () => {
      try {
        // Use raw query since types haven't been regenerated yet
        const { data: jobs, error } = await supabase
          .from('venue_processing_jobs' as any)
          .select('*')
          .eq('id', currentJob.id)
          .single();

        if (error) {
          console.error('Error fetching job status:', error);
          return;
        }

        if (jobs) {
          const job = jobs as any;
          setCurrentJob({
            id: job.id,
            status: job.status,
            progress_percentage: job.progress_percentage || 0,
            processed_count: job.processed_count || 0,
            total_payments: job.total_payments,
            error_count: job.error_count || 0
          });

          if (job.status === 'completed') {
            toast.success(`Background job completed! Processed ${job.processed_count} payments.`);
          } else if (job.status === 'completed_with_errors') {
            toast.warning(`Background job completed with ${job.error_count} errors. Processed ${job.processed_count} payments.`);
          } else if (job.status === 'failed') {
            toast.error(`Background job failed: ${job.error_message}`);
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };

    const interval = setInterval(pollJobStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [currentJob]);

  const handleSyncLocations = async (environment: 'sandbox' | 'production' = 'sandbox') => {
    setIsSyncingLocations(true);
    try {
      toast.info(`Syncing Square locations for ${environment} environment...`);
      
      const { data, error } = await supabase.functions.invoke('sync-square-locations', {
        body: { environment }
      });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        setLastLocationSyncResult({
          locationsProcessed: data.locationsProcessed,
          environment: environment
        });
        toast.success(`Successfully synced ${data.locationsProcessed} locations from ${environment}`);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Location sync error:', error);
      toast.error(`Failed to sync locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncingLocations(false);
    }
  };

  const handleReprocessVenues = async () => {
    setIsReprocessing(true);
    try {
      toast.info(`Starting venue reprocessing for last ${daysBack} days...`);
      
      const { data, error } = await supabase.functions.invoke('reprocess-venues', {
        body: { daysBack: parseInt(daysBack) }
      });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        if (data.jobId) {
          // Background job created
          setCurrentJob({
            id: data.jobId,
            status: 'pending',
            progress_percentage: 0,
            processed_count: 0,
            total_payments: data.totalPayments,
            error_count: 0
          });
          toast.success(`Background job created for ${data.totalPayments} payments. Processing in background...`);
        } else {
          // Immediate processing completed
          setLastReprocessResult({
            processedCount: data.processedCount,
            errorCount: data.errorCount,
            totalPayments: data.totalPayments,
            daysBack: parseInt(daysBack)
          });
          toast.success(`Successfully reprocessed ${data.processedCount} payments from the last ${daysBack} days`);
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Venue reprocessing error:', error);
      toast.error(`Failed to reprocess venues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Venue Mapping Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <h3 className="font-medium">Step 1: Sync Square Locations</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            First, ensure your Square location data is up-to-date. This is required for proper venue mapping.
          </p>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              onClick={() => handleSyncLocations('sandbox')}
              disabled={isSyncingLocations}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Building className={`h-4 w-4 ${isSyncingLocations ? 'animate-spin' : ''}`} />
              {isSyncingLocations ? 'Syncing...' : 'Sync Sandbox Locations'}
            </Button>
            
            <Button 
              onClick={() => handleSyncLocations('production')}
              disabled={isSyncingLocations}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Building className={`h-4 w-4 ${isSyncingLocations ? 'animate-spin' : ''}`} />
              {isSyncingLocations ? 'Syncing...' : 'Sync Production Locations'}
            </Button>

            {lastLocationSyncResult && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Last sync: {lastLocationSyncResult.locationsProcessed} locations from {lastLocationSyncResult.environment}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <h3 className="font-medium">Step 2: Reprocess Venue Mapping</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Apply proper venue mapping to existing payments using the synced location data.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select value={daysBack} onValueChange={setDaysBack} disabled={isReprocessing}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 2 weeks</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
            <Button 
              onClick={handleReprocessVenues}
              disabled={isReprocessing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isReprocessing ? 'animate-spin' : ''}`} />
              {isReprocessing ? 'Reprocessing...' : 'Reprocess Venue Mapping'}
            </Button>

            {lastReprocessResult && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Last run ({lastReprocessResult.daysBack} days): {lastReprocessResult.processedCount}/{lastReprocessResult.totalPayments} processed
                </span>
                {lastReprocessResult.errorCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {lastReprocessResult.errorCount} errors
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Background Job Status */}
          {currentJob && (
            <div className="space-y-3 p-4 border rounded-lg bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Background Job Status</span>
                  <Badge variant={currentJob.status === 'completed' ? 'default' : currentJob.status === 'failed' ? 'destructive' : 'secondary'}>
                    {currentJob.status}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentJob.processed_count}/{currentJob.total_payments} payments
                </span>
              </div>
              
              {currentJob.status === 'processing' && (
                <div className="space-y-2">
                  <Progress value={currentJob.progress_percentage} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currentJob.progress_percentage}% complete</span>
                    <span>{currentJob.error_count > 0 ? `${currentJob.error_count} errors` : 'No errors'}</span>
                  </div>
                </div>
              )}
              
              {currentJob.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Successfully processed {currentJob.processed_count} payments
                </div>
              )}
              
              {currentJob.status === 'completed_with_errors' && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Processed {currentJob.processed_count} payments with {currentJob.error_count} errors
                </div>
              )}
              
              {currentJob.status === 'failed' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Job failed - check logs for details
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Note:</strong> This process will:
          <ul className="mt-1 ml-4 list-disc">
            <li>Fetch current Square locations and store them in the database</li>
            <li>Update all existing revenue events with proper venue names</li>
            <li>Fix any payments that currently show as 'default' venue</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};