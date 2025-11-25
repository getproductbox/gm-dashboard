import { useState, useMemo, useEffect, useRef } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { TimeGrid } from "./TimeGrid";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarMonthView } from "./CalendarMonthView";
import { SidebarResourceFilter } from "./SidebarResourceFilter";
import { ResourceGroup } from "./ResourceFilter"; // Import type, but we use SidebarResourceFilter component
import { BookingDetailsSidebar } from "./BookingDetailsSidebar";
import { CreateBookingSidebar } from "./CreateBookingSidebar";
import { CalendarBooking, CalendarResource } from "@/data/mockData/calendar";
import { useKaraokeBooths } from "@/hooks/useKaraoke";
import { useBookings, useCreateBooking, useUpdateBooking } from "@/hooks/useBookings";
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar as MiniCalendar } from "@/components/ui/calendar";
import { Plus } from "lucide-react";
import { CreateBookingData } from "@/services/bookingService";

type CalendarViewType = 'day' | 'week' | 'month';

const formatDateToYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [isCreateSidebarOpen, setIsCreateSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newBookingInitialData, setNewBookingInitialData] = useState<{
    id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    resourceId?: string;
    service?: "Karaoke" | "Venue Hire";
    customerName?: string;
    customerPhone?: string;
    guests?: number;
  } | null>(null);

  // Fetch karaoke booths
  const { data: rawKaraokeBooths } = useKaraokeBooths();
  const { data: bookings } = useBookings();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();

  // Filter active booths on the client side to be safe
  const karaokeBooths = useMemo(() => {
    return rawKaraokeBooths?.filter(b => b.is_available !== false) || [];
  }, [rawKaraokeBooths]);

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
    setSelectedBooking(booking);
  };

  const handleEditBooking = (booking: CalendarBooking) => {
    setSelectedBooking(null);
    setNewBookingInitialData({
      id: booking.id,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      resourceId: booking.resourceId,
      service: booking.service,
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      guests: booking.guests
    });
    setIsCreateSidebarOpen(true);
  };

  const handleCreateOrUpdateBooking = async (data: any) => {
    const bookingData: CreateBookingData = {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      bookingType: data.service === 'Karaoke' ? 'karaoke_booking' : 'venue_hire',
      venue: data.resourceId.includes('hippie') ? 'hippie' : 'manor',
      bookingDate: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      guestCount: data.guests,
      karaokeBoothId: data.service === 'Karaoke' ? data.resourceId : undefined,
      venueArea: data.service === 'Venue Hire' ? 'full_venue' : undefined,
    };

    if (newBookingInitialData?.id) {
      await updateBooking.mutateAsync({
        id: newBookingInitialData.id,
        data: bookingData
      });
    } else {
      await createBooking.mutateAsync(bookingData);
    }
  };

  const handleSlotClick = (date: Date | string, timeSlot?: string) => {
    // Handle both week/month view (Date) and day view (string resourceId)
    if (date instanceof Date) {
        const dateStr = formatDateToYMD(date);
        if (timeSlot) {
            // Week view click
            console.log('Empty slot clicked (Week View):', { date: dateStr, timeSlot });
            
            // Calculate end time (default 1 hour)
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const endHours = hours + 1;
            const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            setNewBookingInitialData({
                date: dateStr,
                startTime: timeSlot,
                endTime,
            });
            setIsCreateSidebarOpen(true);
        } else {
             // Month view click - open for that day, default time
             console.log('Empty slot clicked (Month View):', { date: dateStr });
             setNewBookingInitialData({
                date: dateStr,
                startTime: "10:00",
                endTime: "11:00",
            });
            setIsCreateSidebarOpen(true);
        }
    } else {
        // Day view passes resourceId as first arg
        const resourceId = date as unknown as string;
        console.log('Empty slot clicked (Day View):', { resourceId, timeSlot, date: currentDate.toISOString().split('T')[0] });
        
        const dateStr = formatDateToYMD(currentDate);
        // Calculate end time (default 1 hour)
        let endTime = "11:00";
        if (timeSlot) {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const endHours = hours + 1;
            endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        // Determine service type based on resource type
        const resource = allResources.find(r => r.id === resourceId);
        const service = resource?.type === 'venue' ? 'Venue Hire' : 'Karaoke';

        setNewBookingInitialData({
            date: dateStr,
            startTime: timeSlot || "10:00",
            endTime,
            resourceId,
            service
        });
        setIsCreateSidebarOpen(true);
    }
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
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      }
      default: {
        return [currentDate];
      }
    }
  }, [currentDate, viewType]);

  // Define resource groups
  const resourceGroups = useMemo<ResourceGroup[]>(() => {
    const groups: ResourceGroup[] = [];

    // Group 1: Venues
    const venueResources: CalendarResource[] = [
      { id: 'manor-venue', name: 'Manor Venue', type: 'venue' },
      { id: 'hippie-venue', name: 'Hippie Club Venue', type: 'venue' }
    ];
    groups.push({
      name: 'Venues',
      resources: venueResources
    });

    // Group 2: Karaoke Booths (only if available)
    if (karaokeBooths && karaokeBooths.length > 0) {
      const boothResources: CalendarResource[] = karaokeBooths.map(booth => ({
        id: booth.id,
        name: booth.name,
        type: 'karaoke' as const,
      }));
      groups.push({
        name: 'Karaoke Booths',
        resources: boothResources
      });
    }

    return groups;
  }, [karaokeBooths]);

  // Flatten all resources for grid usage
  const allResources = useMemo(() => {
    return resourceGroups.flatMap(g => g.resources);
  }, [resourceGroups]);

  // Initialize selected resources when resources load, but only once
  useEffect(() => {
    if (allResources.length > 0 && !hasInitializedFilter) {
      setSelectedResourceIds(allResources.map(r => r.id));
      setHasInitializedFilter(true);
    }
  }, [allResources, hasInitializedFilter]);

  // Get all real bookings for the current date range
  const dateRangeBookings = useMemo(() => {
    // Ensure we're using the correct date format (YYYY-MM-DD) for comparison
    const dateStrings = dateRange.map(formatDateToYMD);
    
    // Real karaoke bookings
    const karaokeBookings: CalendarBooking[] = (bookings || [])
      .filter(booking => {
        const matches = booking.booking_type === 'karaoke_booking' && 
          dateStrings.includes(booking.booking_date) &&
          booking.karaoke_booth_id &&
          booking.start_time &&
          booking.end_time;
        
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
    
    let allBookings = [...karaokeBookings, ...venueBookings];
    
    // Filter by search query if present
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allBookings = allBookings.filter(booking => 
            booking.customer.name.toLowerCase().includes(query) ||
            booking.customer.phone?.toLowerCase().includes(query) ||
            booking.id.toLowerCase().includes(query)
        );
    }

    // Filter by selected resources
    return allBookings.filter(booking => selectedResourceIds.includes(booking.resourceId));
  }, [bookings, dateRange, selectedResourceIds, searchQuery]);

  // For day view, show current date bookings
  const displayBookings = useMemo(() => {
    if (viewType === 'day') {
      const currentDateStr = formatDateToYMD(currentDate);
      return dateRangeBookings.filter(booking => booking.date === currentDateStr);
    }
    return dateRangeBookings;
  }, [dateRangeBookings, currentDate, viewType]);

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-65px)] flex flex-col bg-white dark:bg-gm-neutral-900 overflow-hidden">
        {/* Main Header - Full Width - Fixed */}
        <div className="flex-shrink-0">
            <CalendarHeader
            currentDate={currentDate}
            viewType={viewType}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
            onToday={handleToday}
            onDateSelect={handleDateSelect}
            onViewChange={handleViewChange}
            onSearch={setSearchQuery}
            />
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Fixed width, independent scroll */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-white dark:bg-gm-neutral-900 border-r border-gm-neutral-200 dark:border-gm-neutral-700 p-4 gap-6 hidden lg:flex overflow-y-auto">
            {/* Create Button */}
            <Button 
              onClick={() => {
                setNewBookingInitialData({
                    date: formatDateToYMD(currentDate),
                    startTime: "10:00",
                    endTime: "11:00"
                });
                setIsCreateSidebarOpen(true);
              }}
              className="w-full rounded-full h-12 shadow-sm border border-gm-neutral-200 dark:border-gm-neutral-700 bg-white dark:bg-gm-neutral-800 text-gm-neutral-900 dark:text-gm-neutral-100 hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-700 justify-start px-6 gap-3"
              variant="outline"
            >
              <Plus className="w-6 h-6 text-gm-primary-500" />
              <span className="text-base font-medium">Create</span>
            </Button>

            {/* Mini Calendar */}
            <div className="px-2 flex justify-center">
              <MiniCalendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && handleDateSelect(date)}
                className="rounded-md border shadow-sm p-3"
              />
            </div>

            {/* Resource Filters */}
            <div className="flex-1">
              <SidebarResourceFilter 
                groups={resourceGroups}
                selectedResourceIds={selectedResourceIds}
                onSelectionChange={setSelectedResourceIds}
              />
            </div>
          </div>

          {/* Main Calendar Content - Independent Scroll */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-auto">
                {viewType === 'day' ? (
                <TimeGrid
                    resources={allResources.filter(r => selectedResourceIds.includes(r.id))}
                    bookings={displayBookings}
                    onBookingClick={handleBookingClick}
                    onSlotClick={(resourceId, time) => handleSlotClick(resourceId, time)}
                />
                ) : viewType === 'week' ? (
                <CalendarWeekView
                    dateRange={dateRange}
                    resources={allResources}
                    bookings={dateRangeBookings}
                    onBookingClick={handleBookingClick}
                    onSlotClick={handleSlotClick}
                />
                ) : (
                <CalendarMonthView
                    dateRange={dateRange}
                    currentDate={currentDate}
                    bookings={dateRangeBookings}
                    onBookingClick={handleBookingClick}
                    onDateClick={(date) => handleSlotClick(date)}
                />
                )}
            </div>
          </div>
        </div>

        {/* Modals/Sidebars */}
        <BookingDetailsSidebar
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={handleEditBooking}
        />

        <CreateBookingSidebar
            isOpen={isCreateSidebarOpen}
            onClose={() => setIsCreateSidebarOpen(false)}
            resources={allResources}
            initialData={newBookingInitialData}
            onSubmit={handleCreateOrUpdateBooking}
            isEditing={!!newBookingInitialData?.id}
        />
      </div>
    </TooltipProvider>
  );
};
