
import { useState, useMemo } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { TimeGrid } from "./TimeGrid";
import { CalendarBooking, CalendarResource } from "@/data/mockData/calendar";
import { useKaraokeBooths } from "@/hooks/useKaraoke";
import { useBookings } from "@/hooks/useBookings";
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { TooltipProvider } from "@/components/ui/tooltip";

type CalendarViewType = 'day' | 'week' | 'month';

export const CalendarView = () => {
  // Temporary test: Set to August 1st, 2025 to debug
  const [currentDate, setCurrentDate] = useState(() => {
    const testDate = new Date(2025, 7, 1); // August 1st, 2025 (month is 0-indexed)
    console.log('🎯 Setting test date:', testDate.toISOString(), testDate.toLocaleDateString());
    return testDate;
  });
  const [viewType, setViewType] = useState<CalendarViewType>('day');
  const { data: karaokeBooths } = useKaraokeBooths();
  const { data: bookings } = useBookings();

  const handlePreviousDay = () => {
    let newDate;
    switch (viewType) {
      case 'day': {
        newDate = subDays(currentDate, 1);
        break;
      }
      case 'week': {
        newDate = subDays(currentDate, 7);
        break;
      }
      case 'month': {
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        break;
      }
      default: {
        newDate = subDays(currentDate, 1);
      }
    }
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    let newDate;
    switch (viewType) {
      case 'day': {
        newDate = addDays(currentDate, 1);
        break;
      }
      case 'week': {
        newDate = addDays(currentDate, 7);
        break;
      }
      case 'month': {
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      }
      default: {
        newDate = addDays(currentDate, 1);
      }
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (view: CalendarViewType) => {
    setViewType(view);
  };

  const handleBookingClick = (booking: CalendarBooking) => {
    console.log('Booking clicked:', booking);
    // TODO: Open booking details modal/sidebar
  };

  const handleSlotClick = (resourceId: string, timeSlot: string) => {
    console.log('Empty slot clicked:', { resourceId, timeSlot, date: currentDate.toISOString().split('T')[0] });
    // TODO: Open create booking modal
  };

  // Get the date range based on view type
  const dateRange = useMemo(() => {
    switch (viewType) {
      case 'day': {
        return [currentDate];
      }
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      }
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
      }
      default: {
        return [currentDate];
      }
    }
  }, [currentDate, viewType]);

  // Combine venue resources with real karaoke booth resources
  const allResources = useMemo(() => {
    // Static venue resources for venue hire bookings
    const venueResources: CalendarResource[] = [
      { id: 'manor-venue', name: 'Manor Venue', type: 'venue' },
      { id: 'hippie-venue', name: 'Hippie Club Venue', type: 'venue' }
    ];
    
    const boothResources: CalendarResource[] = (karaokeBooths || []).map(booth => ({
      id: booth.id,
      name: booth.name,
      type: 'karaoke' as const,
    }));
    
    console.log('🎤 Karaoke Booths Debug:', {
      totalBooths: karaokeBooths?.length || 0,
      booths: karaokeBooths?.map(b => ({ id: b.id, name: b.name, venue: b.venue })),
      boothResources: boothResources.map(b => ({ id: b.id, name: b.name }))
    });
    
    return [...venueResources, ...boothResources];
  }, [karaokeBooths]);

  // Get all real bookings for the current date range
  const dateRangeBookings = useMemo(() => {
    // Ensure we're using the correct date format (YYYY-MM-DD) for comparison
    const dateStrings = dateRange.map(date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    
    console.log('🔍 Calendar Debug Info:', {
      currentDate: currentDate.toISOString(),
      currentDateStr: currentDate.toISOString().split('T')[0],
      dateStrings,
      totalBookings: bookings?.length || 0,
      viewType
    });

    // Debug: Log all bookings to see what we have
    if (bookings && bookings.length > 0) {
      console.log('📅 All Bookings:', bookings.map(b => ({
        id: b.id,
        type: b.booking_type,
        date: b.booking_date,
        start: b.start_time,
        end: b.end_time,
        venue: b.venue,
        booth: b.karaoke_booth_id
      })));
    }

    // Real karaoke bookings
    const karaokeBookings: CalendarBooking[] = (bookings || [])
      .filter(booking => {
        const matches = booking.booking_type === 'karaoke_booking' && 
          dateStrings.includes(booking.booking_date) &&
          booking.karaoke_booth_id &&
          booking.start_time &&
          booking.end_time;
        
        if (booking.booking_type === 'karaoke_booking') {
          console.log('🎤 Karaoke Booking Check:', {
            id: booking.id,
            date: booking.booking_date,
            inDateRange: dateStrings.includes(booking.booking_date),
            hasBooth: !!booking.karaoke_booth_id,
            hasTimes: !!(booking.start_time && booking.end_time),
            matches
          });
        }
        
        return matches;
      })
      .map(booking => ({
        id: booking.id,
        resourceId: booking.karaoke_booth_id!,
        startTime: booking.start_time!,
        endTime: booking.end_time!,
        date: booking.booking_date,
        customer: {
          name: booking.customer_name,
          phone: booking.customer_phone || '',
        },
        guests: booking.guest_count || 1,
        status: booking.status as 'confirmed' | 'pending' | 'cancelled',
        service: 'Karaoke' as const,
      }));

    // Real venue hire bookings
    const venueBookings: CalendarBooking[] = (bookings || [])
      .filter(booking => {
        const matches = booking.booking_type === 'venue_hire' && 
          dateStrings.includes(booking.booking_date) &&
          booking.start_time &&
          booking.end_time;
        
        if (booking.booking_type === 'venue_hire') {
          console.log('🏢 Venue Booking Check:', {
            id: booking.id,
            date: booking.booking_date,
            inDateRange: dateStrings.includes(booking.booking_date),
            hasTimes: !!(booking.start_time && booking.end_time),
            matches
          });
        }
        
        return matches;
      })
      .map(booking => ({
        id: booking.id,
        resourceId: `${booking.venue}-venue`,
        startTime: booking.start_time!,
        endTime: booking.end_time!,
        date: booking.booking_date,
        customer: {
          name: booking.customer_name,
          phone: booking.customer_phone || '',
        },
        guests: booking.guest_count || 1,
        status: booking.status as 'confirmed' | 'pending' | 'cancelled',
        service: 'Venue Hire' as const,
      }));
    
    const allBookings = [...karaokeBookings, ...venueBookings];
    console.log('✅ Final Filtered Bookings:', allBookings.length, allBookings);
    
    return allBookings;
  }, [bookings, dateRange]);

  // For day view, show current date bookings
  // For week/month view, we'll need to modify TimeGrid or create new components
  const displayBookings = useMemo(() => {
    if (viewType === 'day') {
      // Use the same date format as the filtering logic
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const currentDateStr = `${year}-${month}-${day}`;
      
      console.log('📅 Day View Filtering:', {
        currentDateStr,
        totalBookings: dateRangeBookings.length,
        filteredBookings: dateRangeBookings.filter(booking => booking.date === currentDateStr).length
      });
      
      return dateRangeBookings.filter(booking => booking.date === currentDateStr);
    }
    return dateRangeBookings;
  }, [dateRangeBookings, currentDate, viewType]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-white dark:bg-gm-neutral-900">
        <CalendarHeader
          currentDate={currentDate}
          viewType={viewType}
          onPreviousDay={handlePreviousDay}
          onNextDay={handleNextDay}
          onToday={handleToday}
          onDateSelect={handleDateSelect}
          onViewChange={handleViewChange}
        />
        
        {viewType === 'day' ? (
          <TimeGrid
            resources={allResources}
            bookings={displayBookings}
            onBookingClick={handleBookingClick}
            onSlotClick={handleSlotClick}
          />
        ) : viewType === 'week' ? (
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gm-neutral-900 dark:text-gm-neutral-100 mb-2">
                Week View
              </h2>
              <p className="text-gm-neutral-600 dark:text-gm-neutral-400">
                Week view is coming soon! Currently showing {format(dateRange[0], 'MMM dd')} - {format(dateRange[dateRange.length - 1], 'MMM dd, yyyy')}
              </p>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {dateRange.map((date, index) => (
                  <div key={index} className="p-2 bg-gm-neutral-50 dark:bg-gm-neutral-800 rounded text-sm text-center">
                    <div className="font-medium text-gm-neutral-900 dark:text-gm-neutral-100">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-gm-neutral-600 dark:text-gm-neutral-400">
                      {format(date, 'dd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gm-neutral-900 dark:text-gm-neutral-100 mb-2">
                Month View
              </h2>
              <p className="text-gm-neutral-600 dark:text-gm-neutral-400">
                Month view is coming soon! Currently showing {format(currentDate, 'MMMM yyyy')}
              </p>
              <div className="mt-4 grid grid-cols-7 gap-1 max-w-md mx-auto">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="p-2 font-medium text-gm-neutral-900 dark:text-gm-neutral-100 text-center">
                    {day}
                  </div>
                ))}
                {dateRange.map((date, index) => (
                  <div key={index} className="p-2 bg-gm-neutral-50 dark:bg-gm-neutral-800 rounded text-sm text-center">
                    <div className="text-gm-neutral-900 dark:text-gm-neutral-100">
                      {format(date, 'dd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
