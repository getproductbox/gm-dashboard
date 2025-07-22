
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type CalendarViewType = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
}

export const CalendarHeader = ({
  currentDate,
  viewType,
  onPreviousDay,
  onNextDay,
  onToday,
  onDateSelect,
  onViewChange
}: CalendarHeaderProps) => {
  // Debug: Log the current date to understand timezone issues
  console.log('📅 CalendarHeader Debug:', {
    currentDate: currentDate.toISOString(),
    currentDateLocal: currentDate.toLocaleDateString(),
    currentDateGB: currentDate.toLocaleDateString('en-GB'),
    currentDateISO: currentDate.toISOString().split('T')[0],
    viewType
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNavigationLabel = () => {
    switch (viewType) {
      case 'day':
        return formatDate(currentDate);
      case 'week':
        return `Week of ${format(currentDate, 'MMM dd, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return formatDate(currentDate);
    }
  };

  const getNavigationButtons = () => {
    const baseClasses = "h-9 w-9 p-0";
    
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousDay}
          className={baseClasses}
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
          className={baseClasses}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between p-6 border-b bg-white dark:bg-gm-neutral-900 border-gm-neutral-200 dark:border-gm-neutral-700">
      <div className="flex items-center space-x-6">
        <div>
          <h1 className="text-2xl font-semibold text-gm-neutral-900 dark:text-gm-neutral-100">
            Calendar
          </h1>
          <p className="text-lg text-gm-neutral-600 dark:text-gm-neutral-300 mt-1">
            {getNavigationLabel()}
          </p>
        </div>
        
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !currentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentDate ? format(currentDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateSelect(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {/* View Selector */}
        <Select value={viewType} onValueChange={onViewChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {getNavigationButtons()}
    </div>
  );
};
