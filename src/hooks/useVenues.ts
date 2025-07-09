import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Venue {
  id: string;
  location_name: string;
}

export const useVenues = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const { data, error } = await supabase
          .from('square_locations')
          .select('id, location_name')
          .eq('is_active', true)
          .order('location_name');

        if (error) throw error;
        setVenues(data || []);
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenues();
  }, []);

  return { venues, isLoading };
};