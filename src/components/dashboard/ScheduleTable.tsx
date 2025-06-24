
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { BookingRow } from "@/services/bookingService";

interface ScheduleTableProps {
  bookings: BookingRow[];
}

export const ScheduleTable = ({ bookings }: ScheduleTableProps) => {
  const handleViewBooking = (bookingId: string) => {
    console.log('View booking:', bookingId);
    // TODO: Implement booking details modal or navigation
  };

  const handleEditBooking = (bookingId: string) => {
    console.log('Edit booking:', bookingId);
    // TODO: Implement booking edit functionality
  };

  const formatVenue = (venue: string) => {
    return venue === 'manor' ? 'Manor' : 'Hippie Club';
  };

  const formatBookingType = (type: string) => {
    return type === 'venue_hire' ? 'Venue Hire' : 'VIP Tickets';
  };

  const formatVenueArea = (area: string | null) => {
    if (!area) return '';
    return area.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDuration = (durationHours: number | null, startTime: string | null, endTime: string | null) => {
    if (durationHours) {
      return `${durationHours}h`;
    }
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    return 'All day';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{booking.start_time || 'All day'}</div>
                  <div className="text-xs text-gm-neutral-500">
                    {formatVenue(booking.venue)}
                    {booking.venue_area && ` - ${formatVenueArea(booking.venue_area)}`}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{formatBookingType(booking.booking_type)}</div>
                  <div className="text-xs text-gm-neutral-500">
                    {formatDuration(booking.duration_hours, booking.start_time, booking.end_time)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{booking.customer_name}</div>
                  <div className="text-xs text-gm-neutral-500">
                    {booking.customer_phone || booking.customer_email || 'No contact'}
                  </div>
                </div>
              </TableCell>
              <TableCell>{booking.guest_count || '-'}</TableCell>
              <TableCell>
                <StatusBadge status={booking.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewBooking(booking.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditBooking(booking.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
