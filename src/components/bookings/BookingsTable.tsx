
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ChevronDown, ChevronUp, Eye, XCircle } from "lucide-react";
import { ExtendedBooking } from "@/data/mockData/bookings";

interface BookingsTableProps {
  bookings: ExtendedBooking[];
  sortField: keyof ExtendedBooking;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof ExtendedBooking) => void;
}

export const BookingsTable = ({
  bookings,
  sortField,
  sortDirection,
  onSort
}: BookingsTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSortIcon = (field: keyof ExtendedBooking) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const handleViewBooking = (booking: ExtendedBooking) => {
    console.log('View booking:', booking);
    // TODO: Implement booking details modal
  };

  const handleCancelBooking = (booking: ExtendedBooking) => {
    console.log('Cancel booking:', booking);
    // TODO: Implement booking cancellation
  };

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
              onClick={() => onSort('reference')}
            >
              <div className="flex items-center">
                Reference
                {getSortIcon('reference')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('customer')}
            >
              <div className="flex items-center">
                Customer
                {getSortIcon('customer')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('service')}
            >
              <div className="flex items-center">
                Service
                {getSortIcon('service')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('date')}
            >
              <div className="flex items-center">
                Date
                {getSortIcon('date')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('time')}
            >
              <div className="flex items-center">
                Time
                {getSortIcon('time')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gm-neutral-50 select-none"
              onClick={() => onSort('guests')}
            >
              <div className="flex items-center">
                Guests
                {getSortIcon('guests')}
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
              onClick={() => onSort('amount')}
            >
              <div className="flex items-center">
                Amount
                {getSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className="hover:bg-gm-neutral-25">
              <TableCell className="font-mono text-sm">{booking.reference}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{booking.customer.name}</div>
                  <div className="text-sm text-gm-neutral-500">{booking.customer.phone}</div>
                </div>
              </TableCell>
              <TableCell>{booking.service}</TableCell>
              <TableCell>{formatDate(booking.date)}</TableCell>
              <TableCell>{booking.time}</TableCell>
              <TableCell>{booking.guests}</TableCell>
              <TableCell>
                <StatusBadge status={booking.status} />
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(booking.amount)}</TableCell>
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
