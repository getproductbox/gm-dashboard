
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ChevronDown, ChevronUp, Eye, XCircle, Loader2 } from "lucide-react";
import { BookingRow } from "@/services/bookingService";
import { useUpdateBookingStatus } from "@/hooks/useBookings";

interface BookingsTableProps {
  bookings: BookingRow[];
  sortField: keyof BookingRow;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof BookingRow) => void;
  isLoading?: boolean;
}

export const BookingsTable = ({
  bookings,
  sortField,
  sortDirection,
  onSort,
  isLoading = false
}: BookingsTableProps) => {
  const updateStatusMutation = useUpdateBookingStatus();

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

  const getSortIcon = (field: keyof BookingRow) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const handleViewBooking = (booking: BookingRow) => {
    console.log('View booking:', booking);
    // TODO: Implement booking details modal or navigation
  };

  const handleCancelBooking = (booking: BookingRow) => {
    updateStatusMutation.mutate({
      id: booking.id,
      status: 'cancelled'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gm-neutral-200 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gm-neutral-400" />
        <p className="text-gm-neutral-500 text-lg mt-4">Loading bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gm-neutral-200 p-8 text-center">
        <p className="text-gm-neutral-500 text-lg">No bookings found</p>
        <p className="text-gm-neutral-400 text-sm mt-2">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gm-neutral-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('customer_name')}
            >
              <div className="flex items-center">
                Customer
                {getSortIcon('customer_name')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('venue')}
            >
              <div className="flex items-center">
                Venue
                {getSortIcon('venue')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('booking_type')}
            >
              <div className="flex items-center">
                Type
                {getSortIcon('booking_type')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('booking_date')}
            >
              <div className="flex items-center">
                Date
                {getSortIcon('booking_date')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('start_time')}
            >
              <div className="flex items-center">
                Time
                {getSortIcon('start_time')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('guest_count')}
            >
              <div className="flex items-center">
                Guests
                {getSortIcon('guest_count')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIcon('status')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('total_amount')}
            >
              <div className="flex items-center">
                Amount
                {getSortIcon('total_amount')}
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="hover:bg-gm-neutral-25">
              <TableCell>
                <div>
                  <div className="font-medium">{booking.customer_name}</div>
                  <div className="text-sm text-gm-neutral-500">
                    {booking.customer_phone || booking.customer_email || 'No contact'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{formatVenue(booking.venue)}</div>
                  {booking.venue_area && (
                    <div className="text-sm text-gm-neutral-500">
                      {formatVenueArea(booking.venue_area)}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{formatBookingType(booking.booking_type)}</div>
                  {booking.ticket_quantity && (
                    <div className="text-sm text-gm-neutral-500">
                      {booking.ticket_quantity} tickets
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(booking.booking_date)}</TableCell>
              <TableCell>
                {booking.start_time ? (
                  <div>
                    <div>{booking.start_time}</div>
                    {booking.end_time && (
                      <div className="text-sm text-gm-neutral-500">
                        to {booking.end_time}
                      </div>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{booking.guest_count || '-'}</TableCell>
              <TableCell>
                <StatusBadge status={booking.status as 'pending' | 'confirmed' | 'cancelled'} />
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(booking.total_amount)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewBooking(booking)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  {booking.status !== 'cancelled' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelBooking(booking)}
                      disabled={updateStatusMutation.isPending}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
