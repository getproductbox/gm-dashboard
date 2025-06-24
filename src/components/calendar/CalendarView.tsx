
import { useState } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { TimeGrid } from "./TimeGrid";
import { mockCalendarResources, mockCalendarBookings, CalendarBooking } from "@/data/mockData/calendar";

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Filter bookings for the current date
  const todaysBookings = mockCalendarBookings.filter(
    booking => booking.date === currentDate.toISOString().split('T')[0]
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <CalendarHeader
        currentDate={currentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
      />
      
      <TimeGrid
        resources={mockCalendarResources}
        bookings={todaysBookings}
        onBookingClick={handleBookingClick}
        onSlotClick={handleSlotClick}
      />
    </div>
  );
};
