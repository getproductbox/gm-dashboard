
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { BookingFilters } from "@/services/bookingService";

interface BookingsFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  onClearFilters: () => void;
}

export const BookingsFilters = ({
  filters,
  onFiltersChange,
  onClearFilters
}: BookingsFiltersProps) => {
  const updateFilter = (key: keyof BookingFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gm-neutral-200 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateTo">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Venue</Label>
          <Select value={filters.venue || 'all'} onValueChange={(value) => updateFilter('venue', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Venues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              <SelectItem value="manor">Manor</SelectItem>
              <SelectItem value="hippie">Hippie Club</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gm-neutral-400" />
            <Input
              id="search"
              placeholder="Customer name or reference..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};
