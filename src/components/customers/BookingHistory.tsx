
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
    return format(new Date(dateString), 'dd/MM');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
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

  // Show only the last 6 bookings for space efficiency
  const recentBookings = bookings.slice(0, 6);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Booking History</span>
          </CardTitle>
          {bookings.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs px-2 py-1 h-auto"
            >
              <span>All ({bookings.length})</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentBookings.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-gm-neutral-300 mx-auto mb-2" />
            <p className="text-gm-neutral-600 text-sm">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Compact Stats */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-gm-neutral-50 rounded text-center">
              <div>
                <div className="text-sm font-semibold text-gm-primary-600">
                  {bookings.length}
                </div>
                <div className="text-xs text-gm-neutral-600">Total</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-600">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.amount || 85), 0))}
                </div>
                <div className="text-xs text-gm-neutral-600">Value</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-600">
                  {formatCurrency(bookings.reduce((sum, booking) => sum + (booking.amount || 85), 0) / bookings.length)}
                </div>
                <div className="text-xs text-gm-neutral-600">Avg</div>
              </div>
            </div>

            {/* Compact Bookings List */}
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs p-2">Date</TableHead>
                    <TableHead className="text-xs p-2">Service</TableHead>
                    <TableHead className="text-xs p-2">Amount</TableHead>
                    <TableHead className="text-xs p-2">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs p-2 font-medium">
                        {formatDate(booking.date)}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        <div className="max-w-[60px] truncate" title={booking.service}>
                          {booking.service}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {formatCurrency(booking.amount || 85)}
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge className={`${getStatusColor(booking.status)} text-xs px-1 py-0`}>
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
