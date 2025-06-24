
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingsList } from "@/components/bookings/BookingsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "@/hooks/useBookings";

const Bookings = () => {
  const navigate = useNavigate();
  const { data: bookings = [] } = useBookings();

  const stats = {
    totalBookings: bookings.length,
    todayBookings: bookings.filter(booking => 
      booking.booking_date === new Date().toISOString().split('T')[0]
    ).length,
    completedBookings: bookings.filter(booking => booking.status === 'completed').length,
    pendingBookings: bookings.filter(booking => booking.status === 'pending').length,
  };

  const handleCreateBooking = () => {
    navigate('/bookings/create');
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
          <Button onClick={handleCreateBooking} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
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

        {/* Bookings List */}
        <BookingsList />
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
