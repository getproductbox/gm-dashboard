import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface WeekOption {
  week_start: string;
  week_label: string;
}

interface WeekSelectorProps {
  onWeekChange: (weekStart: Date | null) => void;
  selectedWeek: Date | null;
}

export const WeekSelector = ({ onWeekChange, selectedWeek }: WeekSelectorProps) => {
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableWeeks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_available_weeks');
        
        if (error) {
          console.error('Error fetching available weeks:', error);
          return;
        }

        setWeeks(data || []);
        
        // Set current week as default if no week is selected
        if (!selectedWeek && data && data.length > 0) {
          const currentWeekStart = new Date(data[0].week_start);
          onWeekChange(currentWeekStart);
        }
      } catch (error) {
        console.error('Error fetching available weeks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableWeeks();
  }, [selectedWeek, onWeekChange]);

  const handleWeekChange = (value: string) => {
    if (value === 'current') {
      onWeekChange(null);
    } else {
      onWeekChange(new Date(value));
    }
  };

  if (isLoading) {
    return (
      <div className="w-[300px]">
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="week-selector" className="text-sm font-medium">
        Select Week:
      </label>
      <Select
        value={selectedWeek ? selectedWeek.toISOString().split('T')[0] : 'current'}
        onValueChange={handleWeekChange}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a week" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Current Week</SelectItem>
          {weeks.map((week) => (
            <SelectItem key={week.week_start} value={week.week_start}>
              {week.week_label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};