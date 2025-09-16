import React, { useState } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LastSyncIndicatorProps {
  lastSyncTime?: string;
  onSyncComplete?: () => void;
}

export const LastSyncIndicator: React.FC<LastSyncIndicatorProps> = ({ lastSyncTime, onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      console.log('Triggering sync-and-transform (since: last)...');
      const { data, error } = await supabase.functions.invoke('sync-and-transform', {
        body: { since: 'last', overlap_minutes: 5, dry_run: false }
      });

      if (error) {
        console.error('Sync & Transform error:', error);
        alert('Sync & Transform failed: ' + error.message);
      } else {
        console.log('Sync & Transform completed:', data);
        alert('Sync & Transform completed successfully!');
        // Call the callback to refresh the sync time
        if (onSyncComplete) {
          onSyncComplete();
        }
      }
    } catch (error) {
      console.error('Error triggering sync-and-transform:', error);
      alert('Error triggering sync-and-transform: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
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
        onClick={triggerSync}
        disabled={isSyncing}
        className="h-6 w-6 p-0"
        title="Sync & Transform"
      >
        <RotateCcw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};