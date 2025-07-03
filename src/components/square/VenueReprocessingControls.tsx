import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const VenueReprocessingControls = () => {
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [daysBack, setDaysBack] = useState("14");
  const [lastReprocessResult, setLastReprocessResult] = useState<{
    processedCount: number;
    errorCount: number;
    totalPayments: number;
    daysBack: number;
  } | null>(null);

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
        setLastReprocessResult({
          processedCount: data.processedCount,
          errorCount: data.errorCount,
          totalPayments: data.totalPayments,
          daysBack: parseInt(daysBack)
        });
        toast.success(`Successfully reprocessed ${data.processedCount} payments from the last ${daysBack} days`);
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
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Reprocess existing payments to apply proper venue mapping based on Square location data. 
          This will update all revenue events to use the correct venue names from your Square locations.
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