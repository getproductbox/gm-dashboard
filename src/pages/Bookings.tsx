
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingsList } from "@/components/bookings/BookingsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "@/hooks/useBookings";
import { UnifiedBookingSidePanel } from "@/components/bookings/UnifiedBookingSidePanel";

const Bookings = () => {
  const navigate = useNavigate();
  const { data: bookings = [] } = useBookings();
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);

  const stats = {
    totalBookings: bookings.length,
    todayBookings: bookings.filter(booking => 
      booking.booking_date === new Date().toISOString().split('T')[0]
    ).length,
    completedBookings: bookings.filter(booking => booking.status === 'completed').length,
    pendingBookings: bookings.filter(booking => booking.status === 'pending').length,
     karaokeBookings: bookings.filter(booking => 
      booking.booking_type === 'karaoke_booking' || 
      (booking.booking_type === 'venue_hire' && booking.venue_area === 'karaoke')
    ).length,
  };

  const handleCreateBooking = () => {
    setIsCreateBookingOpen(true);
  };

  const handleBookingCreated = () => {
    setIsCreateBookingOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gm-neutral-900">Bookings</h1>
            <p className="text-gm-neutral-600">
              {stats.totalBookings} bookings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/booth-management')}
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" />
              Manage Booths
            </Button>
            <Button onClick={handleCreateBooking} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Bookings</TabsTrigger>
            <TabsTrigger value="venue">Venue Bookings</TabsTrigger>
            <TabsTrigger value="vip">VIP Tickets</TabsTrigger>
            <TabsTrigger value="karaoke">Karaoke Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <BookingsList />
          </TabsContent>
          
          <TabsContent value="venue" className="mt-6">
            <BookingsList 
              initialFilters={{ bookingType: 'venue_hire' }}
              title="Venue Bookings"
            />
          </TabsContent>
          
          <TabsContent value="vip" className="mt-6">
            <BookingsList 
              initialFilters={{ bookingType: 'vip_tickets' }}
              title="VIP Tickets"
            />
          </TabsContent>
          
          <TabsContent value="karaoke" className="mt-6">
            <BookingsList 
              initialFilters={{ bookingType: 'karaoke_booking' }}
              title="Karaoke Bookings"
            />
          </TabsContent>
        </Tabs>

        {/* Create Booking Side Panel */}
        <UnifiedBookingSidePanel
          isOpen={isCreateBookingOpen}
          onClose={handleBookingCreated}
        />
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
