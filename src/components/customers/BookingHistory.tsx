
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking History
          </CardTitle>
          {bookings.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="flex items-center gap-2"
            >
              View All ({bookings.length})
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gm-neutral-300 mx-auto mb-4" />
            <p className="text-gm-neutral-600 text-sm">No booking history yet</p>
            <p className="text-gm-neutral-500 text-xs mt-1">
              This customer hasn't made any bookings
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gm-neutral-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-gm-primary-600">
                  {bookings.length}
                </div>
                <div className="text-xs text-gm-neutral-600">Total Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.amount || 85), 0))}
                </div>
                <div className="text-xs text-gm-neutral-600">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.amount || 85), 0) / bookings.length)}
                </div>
                <div className="text-xs text-gm-neutral-600">Avg. Value</div>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {formatDate(booking.date)}
                      </TableCell>
                      <TableCell>{booking.service}</TableCell>
                      <TableCell>{formatCurrency(booking.amount || 85)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
