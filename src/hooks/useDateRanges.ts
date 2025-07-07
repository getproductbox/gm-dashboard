import { useState, useCallback } from 'react';

export interface DateRangeOption {
  label: string;
  getDates: () => { start: Date; end: Date };
}

export const useDateRanges = () => {
  // Set default dates to recent data range (last 7 days from July 3, 2025)
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(new Date(2025, 5, 26)); // June 26, 2025
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(new Date(2025, 6, 3)); // July 3, 2025

  const quickRangeOptions: DateRangeOption[] = [
    {
      label: 'Last 7 Days',
      getDates: () => {
        const end = new Date(2025, 6, 3); // July 3, 2025 (latest data)
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        return { start, end };
      }
    },
    {
      label: 'Last 30 Days',
      getDates: () => {
        const end = new Date(2025, 6, 3); // July 3, 2025 (latest data)
        const start = new Date(end);
        start.setDate(start.getDate() - 29);
        return { start, end };
      }
    },
    {
      label: 'This Month (July)',
      getDates: () => ({
        start: new Date(2025, 6, 1), // July 1, 2025
        end: new Date(2025, 6, 3)   // July 3, 2025 (latest data)
      })
    },
    {
      label: 'Last Month (June)',
      getDates: () => ({
        start: new Date(2025, 5, 1), // June 1, 2025
        end: new Date(2025, 5, 30)   // June 30, 2025
      })
    },
    {
      label: 'All Data',
      getDates: () => ({
        start: new Date(2025, 2, 8), // March 8, 2025 (earliest data)
        end: new Date(2025, 6, 3)    // July 3, 2025 (latest data)
      })
    }
  ];

  const applyQuickRange = useCallback((option: DateRangeOption) => {
    const { start, end } = option.getDates();
    setSelectedStartDate(start);
    setSelectedEndDate(end);
  }, []);

  const isValidDateRange = useCallback(() => {
    return selectedStartDate && selectedEndDate && selectedStartDate <= selectedEndDate;
  }, [selectedStartDate, selectedEndDate]);

  return {
    selectedStartDate,
    selectedEndDate,
    setSelectedStartDate,
    setSelectedEndDate,
    quickRangeOptions,
    applyQuickRange,
    isValidDateRange
  };
};