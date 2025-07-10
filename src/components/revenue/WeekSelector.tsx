import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WeekSelectorProps {
  selectedWeek: string;
  onWeekChange: (week: string) => void;
  availableWeeks: Array<{ week_start: string; week_label: string }>;
}

export const WeekSelector = ({ selectedWeek, onWeekChange, availableWeeks }: WeekSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="week-selector" className="text-sm font-medium">
        Select Week:
      </label>
      <Select value={selectedWeek} onValueChange={onWeekChange}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Select a week" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Current Week</SelectItem>
          {availableWeeks.map((week) => (
            <SelectItem key={week.week_start} value={week.week_start}>
              {week.week_label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};