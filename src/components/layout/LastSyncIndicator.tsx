import React, { useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LastSyncIndicatorProps {
  lastSyncTime?: string;
}

export const LastSyncIndicator: React.FC<LastSyncIndicatorProps> = ({ lastSyncTime }) => {
  const [isTransforming, setIsTransforming] = useState(false);

  const triggerTransform = async () => {
    setIsTransforming(true);
    try {
      console.log('Triggering transform of recent transactions...');
      const { data, error } = await supabase.rpc('transform_recent_synced_transactions', {
        minutes_back: 1440
      });

      if (error) {
        console.error('Transform error:', error);
        alert('Transform failed: ' + error.message);
      } else {
        console.log('Transform completed successfully:', data);
        const message = `Transform completed successfully!

Time Window: Last ${data.minutes_back} minutes (${Math.round(data.minutes_back / 60)} hours)
Raw Payments Found: ${data.total_recent_synced}
Events Processed: ${data.processed_count}

${data.sample_results && data.sample_results.length > 0 ? 
  `Sample Event: ${data.sample_results[0].venue} - $${(data.sample_results[0].amount_cents / 100).toFixed(2)}` : ''}`;
        alert(message);
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