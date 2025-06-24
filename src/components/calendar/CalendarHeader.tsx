
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export const CalendarHeader = ({
  currentDate,
  onPreviousDay,
  onNextDay,
  onToday
}: CalendarHeaderProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-between p-6 border-b bg-white">
      <div>
        <h1 className="text-2xl font-semibold text-gm-neutral-900">
          Calendar
        </h1>
        <p className="text-lg text-gm-neutral-600 mt-1">
          {formatDate(currentDate)}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousDay}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="px-4"
        >
          Today
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextDay}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
