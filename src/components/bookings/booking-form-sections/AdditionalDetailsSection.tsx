import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UnifiedBookingFormValues } from "../UnifiedBookingSidePanel";

interface AdditionalDetailsSectionProps {
  control: Control<UnifiedBookingFormValues>;
  bookingType: string | undefined;
  hideHeader?: boolean;
}

export const AdditionalDetailsSection = ({
  control,
  bookingType,
  hideHeader,
}: AdditionalDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      {!hideHeader && <h3 className="font-medium border-b pb-2">Additional Details</h3>}

      <FormField
        control={control}
        name="specialRequests"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Requests</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any special requirements or notes..."
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="staffNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Staff Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Internal notes for staff..."
                rows={2}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pricing - for VIP tickets */}
      {bookingType === "vip_tickets" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="costPerTicket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Per Ticket ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};

