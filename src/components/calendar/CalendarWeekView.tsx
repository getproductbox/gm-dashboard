import { useMemo } from "react";
import { format, addMinutes, startOfDay, differenceInMinutes } from "date-fns";
import { CalendarBooking, CalendarResource, generateTimeSlots } from "@/types/calendar";
import { BookingBlock } from "./BookingBlock";
import { cn } from "@/lib/utils";

interface CalendarWeekViewProps {
  dateRange: Date[];
  resources: CalendarResource[];
  bookings: CalendarBooking[];
  onBookingClick: (booking: CalendarBooking) => void;
  onSlotClick: (date: Date, time: string) => void;
}

// Helper to calculate layout for overlapping events
interface EventPosition {
  top: number;
  height: number;
  left: number;
  width: number;
}

const calculateEventPositions = (bookings: CalendarBooking[], date: Date): Map<string, EventPosition> => {
  const positions = new Map<string, EventPosition>();
  
  // Filter bookings for this date
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayBookings = bookings.filter(b => b.date === dateStr);
  
  if (dayBookings.length === 0) return positions;

  // Sort by start time
  const sorted = [...dayBookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  // Simple overlap detection algorithm
  // 1. Group overlapping events
  // 2. Assign columns within groups
  
  // Calculate vertical position (top/height) first for all
  const verticalPositions = sorted.map(booking => {
    const [startH, startM] = booking.startTime.split(':').map(Number);
    const [endH, endM] = booking.endTime.split(':').map(Number);
    
    // Grid starts at 10:00 AM
    const startMinutes = (startH * 60 + startM) - (10 * 60);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    // 60px per hour = 1px per minute
    return {
      id: booking.id,
      top: startMinutes,
      height: durationMinutes,
      start: startH * 60 + startM,
      end: endH * 60 + endM
    };
  });

  // Detect overlaps and assign horizontal slots
  const assignedSlots: { id: string, slotIndex: number, totalSlots: number }[] = [];
  
  // Iterate through each booking and find what it overlaps with
  for (let i = 0; i < sorted.length; i++) {
    const current = verticalPositions[i];
    
    // Find overlapping events
    const overlaps = verticalPositions.filter((other, idx) => {
        if (i === idx) return true;
        return (current.start < other.end && current.end > other.start);
    });
    
    // Determine slot index based on existing assignments in the overlap group
    const usedSlots = new Set<number>();
    overlaps.forEach(overlap => {
       const existing = assignedSlots.find(a => a.id === overlap.id);
       if (existing) usedSlots.add(existing.slotIndex);
    });
    
    let slotIndex = 0;
    while (usedSlots.has(slotIndex)) {
        slotIndex++;
    }
    
    assignedSlots.push({
        id: current.id,
        slotIndex,
        totalSlots: overlaps.length // This is an approximation, refined below
    });
  }
  
  // Refine totalSlots based on maximum slotIndex in overlapping groups
  // This is a simplified approach; a perfect layout algorithm is complex (see interval coloring)
  // We'll use the max concurrent overlaps as the denominator
  
  verticalPositions.forEach(pos => {
      const assigned = assignedSlots.find(a => a.id === pos.id);
      if (assigned) {
          const overlaps = verticalPositions.filter(other => 
            (pos.start < other.end && pos.end > other.start)
          );
          // Calculate max overlaps for this group
          const maxConcurrent = overlaps.length; // Simplified
          
          // Actually, we should find the max stack depth for this cluster
          // But for now, let's try: width = 100% / maxConcurrent
          // left = slotIndex * width
          
          // Better: width = (100 - 10)% / maxConcurrent (leave some gap)
          const widthPercent = 95 / (overlaps.length || 1);
          const leftPercent = (assigned.slotIndex * widthPercent);
          
          positions.set(pos.id, {
              top: pos.top,
              height: pos.height,
              left: leftPercent,
              width: widthPercent
          });
      }
  });

  return positions;
};

export const CalendarWeekView = ({
  dateRange,
  resources,
  bookings,
  onBookingClick,
  onSlotClick
}: CalendarWeekViewProps) => {
  const timeSlots = generateTimeSlots();

  const formatTimeDisplay = (time: string) => {
    const [hours] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12} ${ampm}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gm-neutral-900">
      {/* Header */}
      <div className="flex border-b border-gm-neutral-200 dark:border-gm-neutral-700 bg-gm-neutral-50 dark:bg-gm-neutral-800">
        {/* Time Column Header */}
        <div className="w-20 flex-shrink-0 border-r border-gm-neutral-200 dark:border-gm-neutral-700" />
        
        {/* Days Header */}
        <div className="flex-1 grid grid-cols-7">
          {dateRange.map((date, index) => (
            <div
              key={index}
              className="py-2 px-1 text-center border-r border-gm-neutral-200 dark:border-gm-neutral-700 last:border-r-0"
            >
              <div className="text-sm font-medium text-gm-neutral-900 dark:text-gm-neutral-100">
                {format(date, 'EEE')}
              </div>
              <div className={cn(
                "text-xs mt-1 inline-block px-2 py-0.5 rounded-full",
                format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? "bg-gm-primary-500 text-white"
                  : "text-gm-neutral-500 dark:text-gm-neutral-400"
              )}>
                {format(date, 'dd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative min-h-[600px]">
          {/* Time Labels Column */}
          <div className="w-20 flex-shrink-0 bg-gm-neutral-50 dark:bg-gm-neutral-800 border-r border-gm-neutral-200 dark:border-gm-neutral-700 z-10 sticky left-0">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-[60px] border-b border-gm-neutral-200 dark:border-gm-neutral-700 text-xs text-gm-neutral-500 dark:text-gm-neutral-400 flex items-start justify-center pt-2"
              >
                {formatTimeDisplay(time)}
              </div>
            ))}
          </div>

          {/* Days Columns Container */}
          <div className="flex-1 grid grid-cols-7">
            {dateRange.map((date) => {
              const positions = calculateEventPositions(bookings, date);
              
              return (
                <div
                  key={date.toISOString()}
                  className="relative border-r border-gm-neutral-200 dark:border-gm-neutral-700 last:border-r-0 bg-white dark:bg-gm-neutral-900 min-h-full"
                >
                  {/* Background Grid Lines */}
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-[60px] border-b border-gm-neutral-200 dark:border-gm-neutral-700"
                      onClick={() => onSlotClick(date, time)}
                    />
                  ))}

                  {/* Bookings Layer */}
                  {bookings
                    .filter(b => b.date === format(date, 'yyyy-MM-dd'))
                    .map(booking => {
                        const pos = positions.get(booking.id);
                        if (!pos) return null;

                        return (
                            <div
                                key={booking.id}
                                className="absolute z-10 transition-all hover:z-20"
                                style={{
                                    top: `${pos.top}px`,
                                    height: `${pos.height}px`,
                                    left: `${pos.left}%`,
                                    width: `${pos.width}%`,
                                    padding: '0 2px'
                                }}
                            >
                                <div className="h-full w-full relative">
                                    <BookingBlock
                                        booking={booking}
                                        onClick={onBookingClick}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    
                  {/* Current Time Indicator (if today) */}
                  {format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                    (() => {
                        const now = new Date();
                        const startOfGrid = new Date(now);
                        startOfGrid.setHours(10, 0, 0, 0);
                        
                        const minutesSinceStart = differenceInMinutes(now, startOfGrid);
                        
                        if (minutesSinceStart >= 0 && minutesSinceStart < 14 * 60) { // 14 hours grid height
                            return (
                                <div 
                                    className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none"
                                    style={{ top: `${minutesSinceStart}px` }}
                                >
                                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                                </div>
                            );
                        }
                        return null;
                    })()
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


















