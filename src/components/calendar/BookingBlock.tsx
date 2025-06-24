
import { CalendarBooking } from "@/data/mockData/calendar";
import { cn } from "@/lib/utils";

interface BookingBlockProps {
  booking: CalendarBooking;
  onClick: (booking: CalendarBooking) => void;
}

export const BookingBlock = ({ booking, onClick }: BookingBlockProps) => {
  const getStatusStyles = (status: CalendarBooking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gm-neutral-100 border-gm-neutral-300 text-gm-neutral-800';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md border-2 p-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 z-10",
        getStatusStyles(booking.status)
      )}
      onClick={() => onClick(booking)}
      style={{
        top: '2px',
        bottom: '2px'
      }}
    >
      <div className="text-xs font-medium truncate">
        {booking.customer.name}
      </div>
      <div className="text-xs opacity-75 mt-1">
        {booking.guests} guests
      </div>
      <div className="text-xs opacity-75">
        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
      </div>
    </div>
  );
};
