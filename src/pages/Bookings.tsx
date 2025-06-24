
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingsList } from "@/components/bookings/BookingsList";

const Bookings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gm-neutral-900">Bookings</h1>
          <p className="text-gm-neutral-600">Manage all venue bookings and reservations</p>
        </div>
        <BookingsList />
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
