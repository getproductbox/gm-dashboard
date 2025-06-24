
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, BarChart3, Search } from "lucide-react";

export const QuickActions = () => {
  const handleCreateBooking = () => {
    console.log('Create new booking');
  };

  const handleViewCalendar = () => {
    console.log('View full calendar');
  };

  const handleTodaysReports = () => {
    console.log('View today\'s reports');
  };

  const handleCustomerLookup = () => {
    console.log('Customer lookup');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreateBooking}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gm-primary-500 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gm-neutral-900">Create New Booking</div>
              <div className="text-sm text-gm-neutral-500">Add a new reservation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewCalendar}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gm-neutral-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gm-neutral-600" />
            </div>
            <div>
              <div className="font-semibold text-gm-neutral-900">View Full Calendar</div>
              <div className="text-sm text-gm-neutral-500">See all bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleTodaysReports}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gm-neutral-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gm-neutral-600" />
            </div>
            <div>
              <div className="font-semibold text-gm-neutral-900">Today's Reports</div>
              <div className="text-sm text-gm-neutral-500">View daily analytics</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCustomerLookup}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gm-neutral-100 rounded-lg">
              <Search className="h-5 w-5 text-gm-neutral-600" />
            </div>
            <div>
              <div className="font-semibold text-gm-neutral-900">Customer Lookup</div>
              <div className="text-sm text-gm-neutral-500">Find customer details</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
