
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export const ApiSettings = () => {
  const [isTransforming, setIsTransforming] = useState(false);

  const triggerTransform = async () => {
    setIsTransforming(true);
    try {
      const { data, error } = await supabase.rpc('transform_recent_synced_transactions', {
        minutes_back: 1440
      });

      if (error) {
        alert('Transform failed: ' + error.message);
      } else {
        const message = `Transform completed successfully!

Time Window: Last ${data.minutes_back} minutes (${Math.round(data.minutes_back / 60)} hours)
Raw Payments Found: ${data.total_recent_synced}
Events Processed: ${data.processed_count}

${data.sample_results && data.sample_results.length > 0 ? 
  `Sample Event: ${data.sample_results[0].venue} - $${(data.sample_results[0].amount_cents / 100).toFixed(2)}` : ''}`;
        alert(message);
      }
    } catch (error) {
      alert('Error triggering transform: ' + (error as Error).message);
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Transform</CardTitle>
          <CardDescription>
            Transform recently synced payments to revenue events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Transform Recent</h4>
              <p className="text-sm text-muted-foreground">Runs transform for the last 24 hours</p>
            </div>
            <Button 
              onClick={triggerTransform} 
              disabled={isTransforming}
              size="sm"
              variant="outline"
            >
              {isTransforming ? 'Transforming...' : 'Run Transform'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
