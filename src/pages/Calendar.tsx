
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CalendarView } from "@/components/calendar/CalendarView";

const Calendar = () => {
  return (
    <DashboardLayout>
      <div className="h-full -m-6">
        <CalendarView />
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
