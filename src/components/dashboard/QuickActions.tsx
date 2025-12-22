
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BarChart3, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  const handleViewCalendar = () => {
    navigate('/calendar');
  };

  const handleTodaysReports = () => {
    // View today's reports (not implemented)
  };

  const handleCustomerLookup = () => {
    // Customer lookup (not implemented)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
