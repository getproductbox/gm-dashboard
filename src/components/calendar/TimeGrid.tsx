
import { CalendarBooking, CalendarResource, generateTimeSlots } from "@/types/calendar";
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

  // Helper function to calculate which time slot a booking starts in
  const getTimeSlotIndex = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const startTimeInMinutes = 10 * 60; // 10:00 AM
    return Math.floor((timeInMinutes - startTimeInMinutes) / 60);
  };

  // Helper function to calculate booking duration in hours
  const getBookingDuration = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startInMinutes = startHours * 60 + startMinutes;
    const endInMinutes = endHours * 60 + endMinutes;
    return (endInMinutes - startInMinutes) / 60;
  };

  // Helper function to check if a booking occupies a specific time slot
  const isBookingInTimeSlot = (booking: CalendarBooking, timeSlot: string) => {
    const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(':').map(Number);
    const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(':').map(Number);
    const [slotHours] = timeSlot.split(':').map(Number);
    
    const bookingStartInMinutes = bookingStartHours * 60 + bookingStartMinutes;
    const bookingEndInMinutes = bookingEndHours * 60 + bookingEndMinutes;
    const slotInMinutes = slotHours * 60;
    
    return slotInMinutes >= bookingStartInMinutes && slotInMinutes < bookingEndInMinutes;
  };

  // Helper function to check if this is the first time slot for a booking
  const isFirstSlotForBooking = (booking: CalendarBooking, timeSlot: string) => {
    const [bookingStartHours] = booking.startTime.split(':').map(Number);
    const [slotHours] = timeSlot.split(':').map(Number);
    return bookingStartHours === slotHours;
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
        <div className="sticky top-0 bg-gm-neutral-50 dark:bg-gm-neutral-800 border-b border-r border-gm-neutral-200 dark:border-gm-neutral-700 flex items-center justify-center text-sm font-medium text-gm-neutral-600 dark:text-gm-neutral-300 z-20">
          Time
        </div>
        
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="sticky top-0 bg-gm-neutral-50 dark:bg-gm-neutral-800 border-b border-r border-gm-neutral-200 dark:border-gm-neutral-700 flex items-center justify-center text-sm font-medium text-gm-neutral-900 dark:text-gm-neutral-100 px-2 z-20"
          >
            <div className="text-center">
              <div className="truncate">{resource.name}</div>
              <div className="text-xs text-gm-neutral-500 dark:text-gm-neutral-400 capitalize">{resource.type}</div>
            </div>
          </div>
        ))}

        {/* Time Slots */}
        {timeSlots.map((time, timeIndex) => (
          <>
            {/* Time Label */}
            <div
              key={`time-${time}`}
              className="border-b border-r border-gm-neutral-200 dark:border-gm-neutral-700 bg-gm-neutral-50 dark:bg-gm-neutral-800 flex items-center justify-center text-sm text-gm-neutral-600 dark:text-gm-neutral-300 sticky left-0 z-10"
            >
              {formatTimeDisplay(time)}
            </div>
            
            {/* Resource Slots */}
            {resources.map((resource) => {
              // Get bookings for this resource and time slot
              const resourceBookings = bookings.filter(booking => 
                booking.resourceId === resource.id && 
                isBookingInTimeSlot(booking, time)
              );

              // Check if any booking starts in this time slot
              const bookingStartsHere = resourceBookings.find(booking => 
                isFirstSlotForBooking(booking, time)
              );

              return (
                <div
                  key={`${resource.id}-${time}`}
                  className={cn(
                    "border-b border-r border-gm-neutral-200 dark:border-gm-neutral-700 relative min-h-[60px] transition-colors",
                    timeIndex % 2 === 0 ? "bg-white dark:bg-gm-neutral-900" : "bg-gm-neutral-25 dark:bg-gm-neutral-850",
                    resourceBookings.length === 0 && "hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800 cursor-pointer"
                  )}
                  onClick={() => resourceBookings.length === 0 && onSlotClick(resource.id, time)}
                >
                  {/* Render booking block only in the first slot it occupies */}
                  {bookingStartsHere && (
                    <div 
                      className="absolute inset-0 z-10"
                      style={{
                        height: `${getBookingDuration(bookingStartsHere.startTime, bookingStartsHere.endTime) * 60}px`
                      }}
                    >
                      <BookingBlock
                        booking={bookingStartsHere}
                        onClick={onBookingClick}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
};
