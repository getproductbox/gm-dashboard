
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreateBookingForm } from "@/components/bookings/CreateBookingForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateBooking = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gm-neutral-900">Create New Booking</h1>
          <p className="text-gm-neutral-600">Fill in the details below to create a new booking</p>
        </div>
        
        <CreateBookingForm />
      </div>
    </DashboardLayout>
  );
};

export default CreateBooking;
