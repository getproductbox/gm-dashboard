
import { CalendarBooking } from "@/data/mockData/calendar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Calculate booking duration in hours
  const startHour = parseInt(booking.startTime.split(':')[0]);
  const startMinute = parseInt(booking.startTime.split(':')[1]);
  const endHour = parseInt(booking.endTime.split(':')[0]);
  const endMinute = parseInt(booking.endTime.split(':')[1]);
  
  const durationHours = (endHour + endMinute/60) - (startHour + startMinute/60);
  const isShortBooking = durationHours <= 1.5;

  const renderCompactView = () => (
    <div className="text-xs">
      <div className="font-medium truncate">
        {booking.customer.name}
      </div>
      <div className="opacity-75">
        {booking.guests} guests
      </div>
    </div>
  );

  const renderFullView = () => (
    <div className="text-xs">
      <div className="font-medium truncate">
        {booking.customer.name}
      </div>
      <div className="opacity-75 mt-1">
        {booking.guests} guests
      </div>
      <div className="opacity-75">
        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
      </div>
    </div>
  );

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{booking.customer.name}</div>
      <div className="text-sm opacity-90">{booking.customer.phone}</div>
      <div className="text-sm">{booking.guests} guests</div>
      <div className="text-sm">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
      <div className="text-sm capitalize">{booking.service}</div>
      <div className={cn("text-sm font-medium capitalize", 
        booking.status === 'confirmed' && "text-green-600",
        booking.status === 'pending' && "text-yellow-600",
        booking.status === 'cancelled' && "text-red-600"
      )}>
        {booking.status}
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
          {isShortBooking ? renderCompactView() : renderFullView()}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};
