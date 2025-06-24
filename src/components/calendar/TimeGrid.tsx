
import { CalendarBooking, CalendarResource, generateTimeSlots } from "@/data/mockData/calendar";
import { BookingBlock } from "./BookingBlock";
import { cn } from "@/lib/utils";

interface TimeGridProps {
  resources: CalendarResource[];
  bookings: CalendarBooking[];
  onBookingClick: (booking: CalendarBooking) => void;
  onSlotClick: (resourceId: string, timeSlot: string) => void;
}

export const TimeGrid = ({
  resources,
  bookings,
  onBookingClick,
  onSlotClick
}: TimeGridProps) => {
  const timeSlots = generateTimeSlots();

  const formatTimeDisplay = (time: string) => {
    const [hours] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12} ${ampm}`;
  };

  const getBookingPosition = (booking: CalendarBooking) => {
    const startHour = parseInt(booking.startTime.split(':')[0]);
    const startMinute = parseInt(booking.startTime.split(':')[1]);
    const endHour = parseInt(booking.endTime.split(':')[0]);
    const endMinute = parseInt(booking.endTime.split(':')[1]);
    
    const startRow = (startHour - 10) + (startMinute / 60) + 1;
    const endRow = (endHour - 10) + (endMinute / 60) + 1;
    
    return {
      gridRowStart: Math.ceil(startRow),
      gridRowEnd: Math.ceil(endRow)
    };
  };

  return (
    <div className="flex-1 overflow-auto">
      <div 
        className="grid min-w-max"
        style={{
          gridTemplateColumns: `80px repeat(${resources.length}, minmax(200px, 1fr))`,
          gridTemplateRows: `60px repeat(${timeSlots.length}, 60px)`
        }}
      >
        {/* Header Row */}
        <div className="sticky top-0 bg-gm-neutral-50 border-b border-r border-gm-neutral-200 flex items-center justify-center text-sm font-medium text-gm-neutral-600 z-20">
          Time
        </div>
        
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="sticky top-0 bg-gm-neutral-50 border-b border-r border-gm-neutral-200 flex items-center justify-center text-sm font-medium text-gm-neutral-900 px-2 z-20"
          >
            <div className="text-center">
              <div className="truncate">{resource.name}</div>
              <div className="text-xs text-gm-neutral-500 capitalize">{resource.type}</div>
            </div>
          </div>
        ))}

        {/* Time Slots */}
        {timeSlots.map((time, timeIndex) => (
          <>
            {/* Time Label */}
            <div
              key={`time-${time}`}
              className="border-b border-r border-gm-neutral-200 bg-gm-neutral-50 flex items-center justify-center text-sm text-gm-neutral-600 sticky left-0 z-10"
            >
              {formatTimeDisplay(time)}
            </div>
            
            {/* Resource Slots */}
            {resources.map((resource) => {
              const slotBookings = bookings.filter(
                booking => 
                  booking.resourceId === resource.id &&
                  parseInt(booking.startTime.split(':')[0]) <= parseInt(time.split(':')[0]) &&
                  parseInt(booking.endTime.split(':')[0]) > parseInt(time.split(':')[0])
              );

              return (
                <div
                  key={`${resource.id}-${time}`}
                  className={cn(
                    "border-b border-r border-gm-neutral-200 relative min-h-[60px] hover:bg-gm-neutral-50 cursor-pointer transition-colors",
                    timeIndex % 2 === 0 ? "bg-white" : "bg-gm-neutral-25"
                  )}
                  onClick={() => onSlotClick(resource.id, time)}
                >
                  {/* Show booking blocks only in their start time slot */}
                  {slotBookings
                    .filter(booking => parseInt(booking.startTime.split(':')[0]) === parseInt(time.split(':')[0]))
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="absolute inset-0"
                        style={getBookingPosition(booking)}
                      >
                        <BookingBlock
                          booking={booking}
                          onClick={onBookingClick}
                        />
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
};
