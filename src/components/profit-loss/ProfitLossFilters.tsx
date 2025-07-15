import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { calculatePeriodDates, formatPeriodLabel } from '@/utils/profitLossUtils';

interface ProfitLossFiltersProps {
  onPeriodChange: (startDate: string, endDate: string, period: string) => void;
  onComparisonToggle: (enabled: boolean) => void;
  isLoading?: boolean;
  showComparison?: boolean;
}

export const ProfitLossFilters = ({
  onPeriodChange,
  onComparisonToggle,
  isLoading = false,
  showComparison = false
}: ProfitLossFiltersProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handlePeriodChange = (period: 'month' | 'quarter' | 'year' | 'custom') => {
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const { startDate, endDate } = calculatePeriodDates(period);
      onPeriodChange(startDate, endDate, period);
    }
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      const startDate = customStartDate.toISOString().split('T')[0];
      const endDate = customEndDate.toISOString().split('T')[0];
      onPeriodChange(startDate, endDate, 'custom');
    }
  };

  const getCurrentPeriodLabel = () => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`;
    }
    
    if (selectedPeriod !== 'custom') {
      const { label } = calculatePeriodDates(selectedPeriod);
      return label;
    }
    
    return 'Custom Period';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Period & Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Reporting Period</label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Current Month</SelectItem>
              <SelectItem value="quarter">Current Quarter</SelectItem>
              <SelectItem value="year">Current Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedPeriod !== 'custom' && (
            <p className="text-sm text-gm-neutral-600">
              Showing data for: <strong>{getCurrentPeriodLabel()}</strong>
            </p>
          )}
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === 'custom' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Date</label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Pick start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        setStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">End Date</label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'Pick end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        setEndDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleCustomDateChange}
              disabled={!customStartDate || !customEndDate || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Apply Custom Range'
              )}
            </Button>
          </div>
        )}

        {/* Comparison Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Analysis Options</label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="comparison"
              checked={showComparison}
              onChange={(e) => onComparisonToggle(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="comparison" className="text-sm">
              Show period-over-period comparison
            </label>
          </div>
          {showComparison && (
            <p className="text-xs text-gm-neutral-600">
              Compares current period with previous {selectedPeriod === 'custom' ? 'period' : selectedPeriod}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePeriodChange('month')}
              disabled={isLoading}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePeriodChange('quarter')}
              disabled={isLoading}
            >
              This Quarter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePeriodChange('year')}
              disabled={isLoading}
            >
              This Year
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};