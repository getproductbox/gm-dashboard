
import { useState, useMemo } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { TimeGrid } from "./TimeGrid";
import { CalendarBooking, CalendarResource } from "@/data/mockData/calendar";
import { useKaraokeBooths } from "@/hooks/useKaraoke";
import { useBookings } from "@/hooks/useBookings";

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: karaokeBooths } = useKaraokeBooths();
  const { data: bookings } = useBookings();

  const handlePreviousDay = () => {
    const previousDay = new Date(currentDate);
    previousDay.setDate(currentDate.getDate() - 1);
    setCurrentDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleBookingClick = (booking: CalendarBooking) => {
    console.log('Booking clicked:', booking);
    // TODO: Open booking details modal/sidebar
  };

  const handleSlotClick = (resourceId: string, timeSlot: string) => {
    console.log('Empty slot clicked:', { resourceId, timeSlot, date: currentDate.toISOString().split('T')[0] });
    // TODO: Open create booking modal
  };

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
    
    return [...venueResources, ...boothResources];
  }, [karaokeBooths]);

  // Get all real bookings for the current date
  const todaysBookings = useMemo(() => {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    // Real karaoke bookings
    const karaokeBookings: CalendarBooking[] = (bookings || [])
      .filter(booking => 
        booking.booking_type === 'karaoke_booking' && 
        booking.booking_date === currentDateStr &&
        booking.karaoke_booth_id &&
        booking.start_time &&
        booking.end_time
      )
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
      .filter(booking => 
        booking.booking_type === 'venue_hire' && 
        booking.booking_date === currentDateStr &&
        booking.start_time &&
        booking.end_time
      )
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
    
    return [...karaokeBookings, ...venueBookings];
  }, [bookings, currentDate]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gm-neutral-900">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
      />
      
      <TimeGrid
        resources={allResources}
        bookings={todaysBookings}
        onBookingClick={handleBookingClick}
        onSlotClick={handleSlotClick}
      />
    </div>
  );
};
