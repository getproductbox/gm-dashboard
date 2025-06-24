
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScheduleTable } from "@/components/dashboard/ScheduleTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { mockDashboardMetrics, mockTodaysBookings } from "@/data/mockData/bookings";
import { Calendar, DollarSign, Users, Plus } from "lucide-react";

export default function Dashboard() {
  const { todaysBookings, todaysRevenue, currentOccupancy } = mockDashboardMetrics;

  const handleCreateBooking = () => {
    console.log('Create new booking');
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
            value={todaysBookings.total}
            icon={Calendar}
            breakdown={[
              { label: 'Karaoke', value: todaysBookings.breakdown.karaoke, color: '#f97316' },
              { label: 'Venue Hire', value: todaysBookings.breakdown.venueHire, color: '#22c55e' },
              { label: 'Event Tickets', value: todaysBookings.breakdown.eventTickets, color: '#3b82f6' }
            ]}
          />
          <MetricCard
            title="Today's Revenue"
            value={todaysRevenue.amount}
            icon={DollarSign}
            change={todaysRevenue.change}
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
          <ScheduleTable bookings={mockTodaysBookings} />
        </div>
      </div>
    </DashboardLayout>
  );
}
