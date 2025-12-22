
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RevenueEvent {
  id: string;
  square_payment_id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  currency: string;
  payment_date: string;
  payment_hour: number;
  payment_day_of_week: number;
  status: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

interface RevenueFiltersState {
  dateRange: { from?: Date; to?: Date };
  revenueType: string;
  venue: string;
}

interface RevenueFiltersProps {
  revenueData: RevenueEvent[];
  onFilterChange: (filters: RevenueFiltersState) => void;
}

export const RevenueFilters = ({ revenueData, onFilterChange }: RevenueFiltersProps) => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [revenueType, setRevenueType] = useState<string>('all');
  const [venue, setVenue] = useState<string>('all');

  // Get unique venues from data
  const venues = [...new Set(revenueData.map(event => event.venue))];

  const applyFilters = () => {
    onFilterChange({
      dateRange,
      revenueType,
      venue
    });
  };

  const clearFilters = () => {
    setDateRange({});
    setRevenueType('all');
    setVenue('all');
    onFilterChange({
      dateRange: {},
      revenueType: 'all',
      venue: 'all'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Revenue Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Revenue Type</label>
            <Select value={revenueType} onValueChange={setRevenueType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="door">Door</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Venue Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Venue</label>
            <Select value={venue} onValueChange={setVenue}>
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Venues</SelectItem>
                {venues.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
};
