import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { KaraokeBoothRow } from "@/types/karaoke";

interface BookingCalendarViewProps {
  selectedBooth?: KaraokeBoothRow;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  onTimeSlotSelect?: (startTime: string, endTime: string) => void;
  selectedStartTime?: string;
  selectedEndTime?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isSelected: boolean;
  existingBooking?: {
    id: string;
    customerName: string;
    status: string;
  };
}

export const BookingCalendarView = ({
  selectedBooth,
  selectedDate,
  onDateSelect,
  onTimeSlotSelect,
  selectedStartTime,
  selectedEndTime
}: BookingCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  
  const { data: bookings } = useBookings();

  const handlePreviousDay = () => {
    const previousDay = new Date(currentDate);
    previousDay.setDate(currentDate.getDate() - 1);
    setCurrentDate(previousDay);
    onDateSelect?.(previousDay.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);
    onDateSelect?.(nextDay.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect?.(today.toISOString().split('T')[0]);
  };

  // Generate time slots based on booth operating hours
  const timeSlots = useMemo(() => {
    if (!selectedBooth) return [];

    const slots: TimeSlot[] = [];
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    // Get existing bookings for this booth on this date
    const existingBookings = (bookings || []).filter(booking => 
      booking.booking_type === 'karaoke_booking' &&
      booking.karaoke_booth_id === selectedBooth.id &&
      booking.booking_date === currentDateStr &&
      booking.status !== 'cancelled'
    );

    // Generate hourly slots based on booth operating hours
    const startHour = parseInt(selectedBooth.operating_hours_start?.split(':')[0] || '10');
    const endHour = parseInt(selectedBooth.operating_hours_end?.split(':')[0] || '23');

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if this slot conflicts with existing bookings
      const conflictingBooking = existingBookings.find(booking => {
        const bookingStart = booking.start_time;
        const bookingEnd = booking.end_time;
        
        // Check for any overlap
        return (startTime < bookingEnd && endTime > bookingStart);
      });

      const isSelected = selectedStartTime === startTime && selectedEndTime === endTime;
      
      slots.push({
        startTime,
        endTime,
        isAvailable: !conflictingBooking,
        isSelected,
        existingBooking: conflictingBooking ? {
          id: conflictingBooking.id,
          customerName: conflictingBooking.customer_name,
          status: conflictingBooking.status
        } : undefined
      });
    }

    return slots;
  }, [selectedBooth, currentDate, bookings, selectedStartTime, selectedEndTime]);

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      onTimeSlotSelect?.(slot.startTime, slot.endTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSlotStatusColor = (slot: TimeSlot) => {
    if (slot.isSelected) return 'bg-blue-500 text-white border-blue-500';
    if (!slot.isAvailable) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
  };

  if (!selectedBooth) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Please select a karaoke booth to view availability
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Availability for {selectedBooth.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(currentDate)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="px-3 h-8"
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Operating hours: {selectedBooth.operating_hours_start} - {selectedBooth.operating_hours_end}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Capacity: {selectedBooth.capacity} people
            </div>
            <div className="text-sm">
              £{selectedBooth.hourly_rate}/hour
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={`${slot.startTime}-${slot.endTime}`}
                onClick={() => handleSlotClick(slot)}
                disabled={!slot.isAvailable}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${getSlotStatusColor(slot)} ${
                  slot.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {slot.existingBooking && (
                    <div className="text-xs mt-1 truncate">
                      {slot.existingBooking.customerName}
                    </div>
                  )}
                  {slot.isSelected && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {timeSlots.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No time slots available for this booth
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-4 pt-4 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              Available
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              Booked
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 border border-blue-500 rounded"></div>
              Selected
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 