
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export const ApiSettings = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  const triggerSquareSync = async () => {
    setIsSyncing(true);
    try {
      console.log('Triggering Square sync from settings...');
      
      const { data, error } = await supabase.functions.invoke('square-sync-simple', {
        body: {
          max_transactions: 1000
        }
      });

      if (error) {
        console.error('Sync error:', error);
        alert('Sync failed: ' + error.message);
      } else {
        console.log('Sync completed successfully:', data);
        
        // Show success message with details
        const message = `Square sync completed successfully!

Environment: ${data.environment}
Payments Fetched: ${data.payments_fetched}
Payments Synced: ${data.payments_synced}

${data.sample_payment ? `Sample Payment: $${(data.sample_payment.amount / 100).toFixed(2)} on ${new Date(data.sample_payment.created_at).toLocaleDateString()}` : ''}`;
        
        alert(message);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Error triggering sync: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerTransform = async () => {
    setIsTransforming(true);
    try {
      console.log('Triggering transform from settings...');
      
      // Call the existing database function with a longer time window
      const { data, error } = await supabase.rpc('transform_recent_synced_transactions', {
        minutes_back: 1440  // Transform transactions synced in last 24 hours (24 * 60 = 1440 minutes)
      });

      if (error) {
        console.error('Transform error:', error);
        alert('Transform failed: ' + error.message);
      } else {
        console.log('Transform completed successfully:', data);
        
        // Show success message with details
        const message = `Transform completed successfully!

Time Window: Last ${data.minutes_back} minutes (${Math.round(data.minutes_back / 60)} hours)
Raw Payments Found: ${data.total_recent_synced}
Events Processed: ${data.processed_count}

${data.sample_results && data.sample_results.length > 0 ? 
  `Sample Event: ${data.sample_results[0].venue} - $${(data.sample_results[0].amount_cents / 100).toFixed(2)}` : ''}`;
        
        alert(message);
      }
    } catch (error) {
      console.error('Error triggering transform:', error);
      alert('Error triggering transform: ' + (error as Error).message);
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Square Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Square Integration</CardTitle>
          <CardDescription>
            Manage your Square payment processing integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Square POS</h4>
              <p className="text-sm text-muted-foreground">Payment processing and venue management</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Connected</Badge>
          </div>
          
          {/* Sync Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Data Sync</h4>
              <p className="text-sm text-muted-foreground">Manually sync payment data from Square</p>
            </div>
            <Button 
              onClick={triggerSquareSync} 
              disabled={isSyncing}
              size="sm"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          {/* Transform Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Data Transform</h4>
              <p className="text-sm text-muted-foreground">Transform recently synced payments to revenue events</p>
            </div>
            <Button 
              onClick={triggerTransform} 
              disabled={isTransforming}
              size="sm"
              variant="outline"
            >
              {isTransforming ? 'Transforming...' : 'Transform Recent'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Xero Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Xero Integration</CardTitle>
          <CardDescription>
            Manage your Xero accounting integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Xero Accounting</h4>
              <p className="text-sm text-muted-foreground">Financial data synchronization</p>
            </div>
            <Badge variant="outline">Not Connected</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
