
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScheduleTable } from "@/components/dashboard/ScheduleTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "@/hooks/useBookings";

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's bookings
  const { data: todaysBookings = [] } = useBookings({
    dateFrom: today,
    dateTo: today
  });

  // Get all bookings for stats
  const { data: allBookings = [] } = useBookings();

  const todaysRevenue = todaysBookings.reduce((sum, booking) => 
    sum + (booking.total_amount || 0), 0
  );

  const bookingTypeStats = todaysBookings.reduce((acc, booking) => {
    if (booking.booking_type === 'venue_hire') acc.venueHire++;
    else if (booking.booking_type === 'vip_tickets') acc.vipTickets++;
    return acc;
  }, { venueHire: 0, vipTickets: 0 });

  // Mock occupancy data (this would come from a separate venues/rooms API in real app)
  const currentOccupancy = {
    percentage: 67,
    available: 4,
    occupied: 8,
    maintenance: 0,
    total: 12
  };

  const handleCreateBooking = () => {
    navigate('/bookings/create');
  };

  const headerActions = (
    <Button onClick={handleCreateBooking} className="bg-gm-primary-500 hover:bg-gm-primary-600">
      <Plus className="h-4 w-4" />
      Create New Booking
    </Button>
  );

  return (
    <DashboardLayout headerActions={headerActions}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">Dashboard</h1>
          <p className="text-gm-neutral-600">Welcome back! Here's what's happening at Manor today.</p>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Today's Bookings"
            value={todaysBookings.length}
            icon={Calendar}
            breakdown={[
              { label: 'Venue Hire', value: bookingTypeStats.venueHire, color: '#22c55e' },
              { label: 'VIP Tickets', value: bookingTypeStats.vipTickets, color: '#3b82f6' }
            ]}
          />
          <MetricCard
            title="Today's Revenue"
            value={todaysRevenue}
            icon={DollarSign}
          />
          <MetricCard
            title="Current Occupancy"
            value={`${currentOccupancy.percentage}%`}
            icon={Users}
            breakdown={[
              { label: 'Available', value: currentOccupancy.available, color: '#22c55e' },
              { label: 'Occupied', value: currentOccupancy.occupied, color: '#f97316' },
              { label: 'Maintenance', value: currentOccupancy.maintenance, color: '#ef4444' }
            ]}
          />
        </div>

        {/* Today's Schedule */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gm-neutral-900">Today's Schedule</h2>
          <ScheduleTable bookings={todaysBookings} />
        </div>
      </div>
    </DashboardLayout>
  );
}
