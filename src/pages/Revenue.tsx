
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RevenueComparisonTable } from "@/components/revenue/RevenueComparisonTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVenues } from "@/hooks/useVenues";

export default function Revenue() {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const { venues, isLoading: venuesLoading } = useVenues();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Compare revenue performance across different time periods</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="venue-selector" className="text-sm font-medium">
              Venue:
            </label>
            <Select value={selectedVenue} onValueChange={setSelectedVenue} disabled={venuesLoading}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Venues</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.location_name}>
                    {venue.location_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <RevenueComparisonTable selectedVenue={selectedVenue === 'all' ? null : selectedVenue} />
        
        {/* Charts and analytics components will be added here */}
      </div>
    </DashboardLayout>
  );
}
