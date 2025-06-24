
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface BookingHistoryProps {
  bookings: any[];
  onViewAll: () => void;
}

export const BookingHistory = ({ bookings = [], onViewAll }: BookingHistoryProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gm-neutral-100 text-gm-neutral-800';
    }
  };

  // Show only the last 10 bookings
  const recentBookings = bookings.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Booking History</span>
          </CardTitle>
          {bookings.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <span className="hidden sm:inline">View All ({bookings.length})</span>
              <span className="sm:hidden">All ({bookings.length})</span>
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentBookings.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gm-neutral-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gm-neutral-600 text-sm">No booking history yet</p>
            <p className="text-gm-neutral-500 text-xs mt-1">
              This customer hasn't made any bookings
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Quick Stats - Responsive grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gm-neutral-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm sm:text-lg font-semibold text-gm-primary-600">
                  {bookings.length}
                </div>
                <div className="text-xs text-gm-neutral-600">
                  <span className="hidden sm:inline">Total Bookings</span>
                  <span className="sm:hidden">Total</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-semibold text-green-600">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.amount || 85), 0))}
                </div>
                <div className="text-xs text-gm-neutral-600">
                  <span className="hidden sm:inline">Total Value</span>
                  <span className="sm:hidden">Value</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-lg font-semibold text-blue-600">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.amount || 85), 0) / bookings.length)}
                </div>
                <div className="text-xs text-gm-neutral-600">
                  <span className="hidden sm:inline">Avg. Value</span>
                  <span className="sm:hidden">Avg.</span>
                </div>
              </div>
            </div>

            {/* Recent Bookings Table - Responsive layout */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Service</TableHead>
                      <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {formatDate(booking.date)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="max-w-[80px] sm:max-w-none truncate" title={booking.service}>
                            {booking.service}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(booking.amount || 85)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(booking.status)} text-xs px-1.5 py-0.5`}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
