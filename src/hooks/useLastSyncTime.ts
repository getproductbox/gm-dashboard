import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLastSyncTime = () => {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLastSyncTime = async () => {
      try {
        const { data, error } = await supabase
          .from('square_sync_status')
          .select('last_successful_sync')
          .not('last_successful_sync', 'is', null)
          .order('last_successful_sync', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          setLastSyncTime(new Date(data[0].last_successful_sync));
        }
      } catch (error) {
        console.error('Error fetching last sync time:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastSyncTime();
  }, []);

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return {
    lastSyncTime,
    lastSyncFormatted: formatRelativeTime(lastSyncTime),
    isLoading
  };
};