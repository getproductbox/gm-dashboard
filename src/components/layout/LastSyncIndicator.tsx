import React, { useState } from 'react';
import { Clock, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LastSyncIndicatorProps {
  lastSyncTime?: string;
}

export const LastSyncIndicator: React.FC<LastSyncIndicatorProps> = ({ lastSyncTime }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  const triggerManualSync = async () => {
    setIsSyncing(true);
    try {
      console.log('Triggering manual Square sync...');
      
      // Call the enhanced square-sync-simple function
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
        const message = `Sync completed successfully!

Environment: ${data.environment}
Payments Fetched: ${data.payments_fetched}
Payments Synced: ${data.payments_synced}

${data.sample_payment ? `Sample Payment: $${(data.sample_payment.amount / 100).toFixed(2)} on ${new Date(data.sample_payment.created_at).toLocaleDateString()}` : ''}`;
        
        alert(message);
        
        // Refresh the page after a short delay to update the last sync time
        setTimeout(() => window.location.reload(), 2000);
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
      console.log('Triggering transform of recent transactions...');
      
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
        
        // Refresh the page after a short delay to update data
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Error triggering transform:', error);
      alert('Error triggering transform: ' + (error as Error).message);
    } finally {
      setIsTransforming(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>Last synced: {lastSyncTime ? formatTimeAgo(lastSyncTime) : 'never'}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={triggerManualSync}
        disabled={isSyncing}
        className="h-6 w-6 p-0"
        title="Manual Sync"
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={triggerTransform}
        disabled={isTransforming}
        className="h-6 w-6 p-0"
        title="Transform Recent (24h)"
      >
        <Zap className={`h-3 w-3 ${isTransforming ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};