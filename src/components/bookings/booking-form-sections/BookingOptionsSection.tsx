import { Control } from "react-hook-form";
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
import { UnifiedBookingFormValues } from "../UnifiedBookingSidePanel";

interface BookingOptionsSectionProps {
  control: Control<UnifiedBookingFormValues>;
  bookingType: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  availableBoothsForSlot?: any[];
  availableKaraokeBooths?: any[];
  onBoothSelect?: (boothId: string) => void;
  hideHeader?: boolean;
}

export const BookingOptionsSection = ({
  control,
  bookingType,
  startTime,
  endTime,
  availableBoothsForSlot,
  availableKaraokeBooths,
  onBoothSelect,
  hideHeader,
}: BookingOptionsSectionProps) => {
  return (
    <div className="space-y-4">
      {!hideHeader && <h3 className="font-medium border-b pb-2">Booking Options</h3>}

      {/* Karaoke Booth - for karaoke bookings */}
      {bookingType === "karaoke_booking" && startTime && endTime && (
        <FormField
          control={control}
          name="karaokeBoothId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Karaoke Booth *</FormLabel>
              <Select 
                onValueChange={(v) => {
                  field.onChange(v);
                  onBoothSelect?.(v);
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booth" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(availableBoothsForSlot ?? availableKaraokeBooths ?? []).map((booth) => (
                    <SelectItem key={booth.id} value={booth.id}>
                      {booth.name} - Cap {booth.capacity} (${booth.hourly_rate}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select a karaoke booth that supports your group size
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Ticket Quantity - for VIP tickets */}
      {bookingType === "vip_tickets" && (
        <FormField
          control={control}
          name="ticketQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Tickets *</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Guest Count - for venue hire and karaoke */}
      {(bookingType === "venue_hire" || bookingType === "karaoke_booking") && (
        <FormField
          control={control}
          name="guestCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Guests *</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

