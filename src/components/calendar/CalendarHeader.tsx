import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

type CalendarViewType = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
  onSearch: (query: string) => void;
}

export const CalendarHeader = ({
  currentDate,
  viewType,
  onPreviousDay,
  onNextDay,
  onToday,
  onDateSelect,
  onViewChange,
  onSearch
}: CalendarHeaderProps) => {
  const formatDate = (date: Date) => {
    if (viewType === 'day') {
      return format(date, 'MMMM d, yyyy');
    }
    return format(date, 'MMMM yyyy');
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gm-neutral-900 border-gm-neutral-200 dark:border-gm-neutral-700 h-16">
      {/* Left Section: Calendar Text, Today, Nav, Date */}
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="flex items-center gap-2 mr-2 lg:mr-4">
          <span className="text-xl font-medium text-gm-neutral-700 dark:text-gm-neutral-200 hidden sm:inline-block">
            Calendar
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="text-sm font-medium px-4 h-9 border-gm-neutral-300 dark:border-gm-neutral-600 hidden sm:flex"
        >
          Today
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousDay}
            className="h-8 w-8 rounded-full hover:bg-gm-neutral-100 dark:hover:bg-gm-neutral-800"
          >
            <ChevronLeft className="h-5 w-5 text-gm-neutral-600 dark:text-gm-neutral-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextDay}
            className="h-8 w-8 rounded-full hover:bg-gm-neutral-100 dark:hover:bg-gm-neutral-800"
          >
            <ChevronRight className="h-5 w-5 text-gm-neutral-600 dark:text-gm-neutral-400" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="text-xl font-normal text-gm-neutral-800 dark:text-gm-neutral-100 hover:bg-gm-neutral-100 dark:hover:bg-gm-neutral-800 px-2 py-1 rounded transition-colors ml-1">
              {formatDate(currentDate)}
            </button>
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
      </div>
      
      {/* Right Section: Search, View Switcher */}
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gm-neutral-500 dark:text-gm-neutral-400" />
          <Input 
            placeholder="Search" 
            className="pl-8 w-[200px] h-9 bg-gm-neutral-100 dark:bg-gm-neutral-800 border-transparent focus:bg-white dark:focus:bg-gm-neutral-900 transition-all"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 ml-2">
          <Select value={viewType} onValueChange={(v) => onViewChange(v as CalendarViewType)}>
            <SelectTrigger className="w-[100px] h-9 border-gm-neutral-300 dark:border-gm-neutral-600 bg-transparent">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
