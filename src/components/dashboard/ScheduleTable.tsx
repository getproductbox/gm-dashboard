
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Booking } from "@/data/mockData/bookings";

interface ScheduleTableProps {
  bookings: Booking[];
}

export const ScheduleTable = ({ bookings }: ScheduleTableProps) => {
  const handleViewBooking = (bookingId: string) => {
    console.log('View booking:', bookingId);
  };

  const handleEditBooking = (bookingId: string) => {
    console.log('Edit booking:', bookingId);
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
                  <div>{booking.time}</div>
                  {booking.room && (
                    <div className="text-xs text-gm-neutral-500">{booking.room}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{booking.service}</div>
                  <div className="text-xs text-gm-neutral-500">{booking.duration} duration</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{booking.customer.name}</div>
                  <div className="text-xs text-gm-neutral-500">{booking.customer.phone}</div>
                </div>
              </TableCell>
              <TableCell>{booking.guests}</TableCell>
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
