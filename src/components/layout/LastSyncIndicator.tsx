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
      console.log('Triggering sync via API (will resume from last successful sync)...');
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be signed in to trigger a sync.');
        return;
      }
      // Sync will intelligently resume from last successful sync using square_location_sync_status
      const res = await fetch(`${API_BASE}/square/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          overlap_minutes: 5, // Overlap for safety (default)
          max_lookback_days: 30, // Fallback if no previous sync exists
          dry_run: false 
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        console.error('Sync error:', json);
        const stage = json?.stage ? ` (${json.stage})` : '';
        const errorMsg = json?.error || res.statusText || 'Unknown error';
        alert(`Sync failed${stage}: ${errorMsg}`);
        return;
      }
      console.log('Sync completed:', json);
      
      // Show summary if available
      const results = json?.results || [];
      if (results.length > 0) {
        const totalPayments = results.reduce((sum: number, r: any) => 
          sum + (r.payments?.upserted || 0), 0);
        const totalOrders = results.reduce((sum: number, r: any) => 
          sum + (r.orders?.upserted || 0), 0);
        alert(`Sync completed successfully!\n\nLocations: ${results.length}\nPayments: ${totalPayments}\nOrders: ${totalOrders}`);
      } else {
        alert('Sync completed successfully!');
      }
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Error triggering sync: ' + (error as Error).message);
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