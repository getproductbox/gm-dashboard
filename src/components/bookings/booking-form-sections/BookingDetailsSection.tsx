import { Control } from "react-hook-form";
import { format } from "date-fns";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateToISO } from "@/utils/dateUtils";
import { UnifiedBookingFormValues } from "../UnifiedBookingSidePanel";
import { AvailabilityResponse } from "@/types/karaoke";

const venueOptions = [
  { value: "manor", label: "Manor" },
  { value: "hippie", label: "Hippie Club" },
];

const bookingTypeOptions = [
  { value: "venue_hire", label: "Venue Hire" },
  { value: "vip_tickets", label: "VIP Tickets" },
  { value: "karaoke_booking", label: "Karaoke Booking" },
];

const venueAreaOptions = [
  { value: "upstairs", label: "Upstairs" },
  { value: "downstairs", label: "Downstairs" },
  { value: "full_venue", label: "Full Venue" },
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

interface BookingDetailsSectionProps {
  control: Control<UnifiedBookingFormValues>;
  bookingType: string | undefined;
  venue: string | undefined;
  bookingDate: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  venueAvailability?: AvailabilityResponse;
  onTimeSlotSelect?: (start: string, end: string) => void;
  hideHeader?: boolean;
}

export const BookingDetailsSection = ({
  control,
  bookingType,
  venue,
  bookingDate,
  startTime,
  endTime,
  venueAvailability,
  onTimeSlotSelect,
  hideHeader,
}: BookingDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      {!hideHeader && <h3 className="font-medium border-b pb-2">Booking Details</h3>}

      {/* Date */}
      <FormField
        control={control}
        name="bookingDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      formatDate(new Date(field.value))
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    field.onChange(date ? formatDateToISO(date) : "");
                  }}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Venue */}
      <FormField
        control={control}
        name="venue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Venue *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {venueOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Booking Type */}
      <FormField
        control={control}
        name="bookingType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Booking Type *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {bookingTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Time slots for karaoke */}
      {bookingType === "karaoke_booking" && bookingDate && (
        <div>
          <FormLabel>Time Slot *</FormLabel>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(venueAvailability?.slots || []).map((s) => {
              const isSelected = startTime === s.startTime && endTime === s.endTime;
              const disabled = !s.available;
              return (
                <button
                  key={`${s.startTime}-${s.endTime}`}
                  type="button"
                  onClick={() => onTimeSlotSelect?.(s.startTime, s.endTime)}
                  disabled={disabled}
                  className={cn(
                    "p-2 rounded-lg border text-sm font-medium transition-colors",
                    isSelected && "bg-primary text-primary-foreground border-primary",
                    !isSelected && !disabled && "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
                    disabled && "bg-red-100 text-red-700 border-red-200 cursor-not-allowed dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                  )}
                >
                  {s.startTime} - {s.endTime}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time selects for venue hire and VIP tickets */}
      {bookingType && bookingType !== "karaoke_booking" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Start time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="End time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Venue Area - for venue hire */}
      {bookingType === "venue_hire" && (
        <FormField
          control={control}
          name="venueArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Area *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {venueAreaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

