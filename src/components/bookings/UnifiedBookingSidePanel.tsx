import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDateToISO } from "@/utils/dateUtils";
import { useCreateBooking } from "@/hooks/useBookings";
import { useKaraokeBooths, useCreateKaraokeHold, useReleaseKaraokeHold, useFinalizeKaraokeHold, useKaraokeAvailability } from "@/hooks/useKaraoke";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { User, CalendarDays, FileText } from "lucide-react";
import { CustomerDetailsSection } from "./booking-form-sections/CustomerDetailsSection";

interface HoldResponse {
  hold?: {
    id: string;
    expires_at: string;
  };
}
import { BookingDetailsSection } from "./booking-form-sections/BookingDetailsSection";
import { BookingOptionsSection } from "./booking-form-sections/BookingOptionsSection";
import { AdditionalDetailsSection } from "./booking-form-sections/AdditionalDetailsSection";

// Schema for unified booking form
const unifiedBookingSchema = z.object({
  // Customer Info
  customerId: z.string().optional(),
  customerName: z.string().min(2, "Customer name must be at least 2 characters").optional(),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  // Date & Time
  bookingDate: z.string().min(1, "Please select a date"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  // Booking Details
  venue: z.enum(["manor", "hippie"]).optional(),
  bookingType: z.enum(["venue_hire", "vip_tickets", "karaoke_booking"]).optional(),
  venueArea: z.enum(["upstairs", "downstairs", "full_venue"]).optional(),
  karaokeBoothId: z.string().optional(),
  guestCount: z.string().optional(),
  ticketQuantity: z.string().optional(),
  // Additional Details
  specialRequests: z.string().optional(),
  staffNotes: z.string().optional(),
  totalAmount: z.string().optional(),
  costPerTicket: z.string().optional(),
}).refine((data) => {
  // Venue is required
  return data.venue !== undefined;
}, {
  message: "Please select a venue",
  path: ["venue"],
}).refine((data) => {
  // Booking type is required
  return data.bookingType !== undefined;
}, {
  message: "Please select a booking type",
  path: ["bookingType"],
}).refine((data) => {
  // Either customerId or customerName must be provided
  return data.customerId || (data.customerName && data.customerName.length >= 2);
}, {
  message: "Please select a customer or enter customer name",
  path: ["customerName"],
}).refine((data) => {
  // At least one contact method required (unless customerId is provided)
  if (data.customerId) return true;
  return data.customerEmail || data.customerPhone;
}, {
  message: "Please provide either email or phone number",
  path: ["customerEmail"],
}).refine((data) => {
  // Venue area required for venue hire
  if (data.bookingType === "venue_hire" && !data.venueArea) {
    return false;
  }
  return true;
}, {
  message: "Please select a venue area for venue hire bookings",
  path: ["venueArea"],
}).refine((data) => {
  // Ticket quantity required for VIP tickets
  if (data.bookingType === "vip_tickets" && !data.ticketQuantity) {
    return false;
  }
  return true;
}, {
  message: "Please specify ticket quantity for VIP ticket bookings",
  path: ["ticketQuantity"],
}).refine((data) => {
  // Guest count required for venue hire and karaoke
  if ((data.bookingType === "venue_hire" || data.bookingType === "karaoke_booking") && !data.guestCount) {
    return false;
  }
  return true;
}, {
  message: "Please specify number of guests",
  path: ["guestCount"],
}).refine((data) => {
  // Karaoke booth required for karaoke bookings
  if (data.bookingType === "karaoke_booking" && !data.karaokeBoothId) {
    return false;
  }
  return true;
}, {
  message: "Please select a karaoke booth for karaoke bookings",
  path: ["karaokeBoothId"],
});

export type UnifiedBookingFormValues = z.infer<typeof unifiedBookingSchema>;

interface UnifiedBookingSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Partial<UnifiedBookingFormValues>;
  isEditing?: boolean;
}

export const UnifiedBookingSidePanel = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isEditing = false,
}: UnifiedBookingSidePanelProps) => {
  const { toast } = useToast();
  const createBookingMutation = useCreateBooking();
  const { data: karaokeBooths } = useKaraokeBooths();
  const createHold = useCreateKaraokeHold();
  const releaseHold = useReleaseKaraokeHold();
  const finalizeHold = useFinalizeKaraokeHold();

  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  const form = useForm<UnifiedBookingFormValues>({
    resolver: zodResolver(unifiedBookingSchema),
    defaultValues: {
      customerId: undefined,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookingDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "18:00",
      endTime: "19:00",
      venue: undefined, // No default - user must select
      bookingType: undefined, // No default - user must select
      venueArea: undefined,
      karaokeBoothId: undefined,
      guestCount: "",
      ticketQuantity: "1",
      specialRequests: "",
      staffNotes: "",
      totalAmount: "",
      costPerTicket: "",
    },
  });

  // Watch form values for conditional rendering
  const bookingType = form.watch("bookingType");
  const venue = form.watch("venue");
  const bookingDate = form.watch("bookingDate");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const customerId = form.watch("customerId");
  
  // Fetch selected customer details
  const { data: customers } = useCustomers();
  const selectedCustomer = customers?.find((c) => c.id === customerId);

  // Karaoke availability - only fetch when we have all required values
  const { data: venueAvailability } = useKaraokeAvailability({
    venue: bookingType === "karaoke_booking" && venue ? (venue as "manor" | "hippie") : undefined,
    bookingDate: bookingType === "karaoke_booking" && bookingDate ? bookingDate : undefined,
    granularityMinutes: 60,
  });

  // Filter available booths based on selected time slot
  const availableKaraokeBooths = karaokeBooths?.filter(booth => booth.venue === venue) || [];
  const availableBoothsForSlot = venueAvailability?.slots?.find(
    (s) => s.startTime === startTime && s.endTime === endTime
  )?.availableBooths;

  // Update form when initialData changes or sidebar opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        customerId: initialData?.customerId,
        customerName: initialData?.customerName || "",
        customerEmail: initialData?.customerEmail || "",
        customerPhone: initialData?.customerPhone || "",
        bookingDate: initialData?.bookingDate || format(new Date(), "yyyy-MM-dd"),
        startTime: initialData?.startTime || "18:00",
        endTime: initialData?.endTime || "19:00",
        // Only set venue/bookingType if provided in initialData, otherwise user must select
        venue: initialData?.venue,
        bookingType: initialData?.bookingType,
        venueArea: initialData?.venueArea,
        karaokeBoothId: initialData?.karaokeBoothId,
        guestCount: initialData?.guestCount || "",
        ticketQuantity: initialData?.ticketQuantity || "1",
        specialRequests: initialData?.specialRequests || "",
        staffNotes: initialData?.staffNotes || "",
        totalAmount: initialData?.totalAmount || "",
        costPerTicket: initialData?.costPerTicket || "",
      });
      // Reset hold state when panel opens
      setActiveHoldId(null);
      setHoldExpiresAt(null);
    }
  }, [isOpen, initialData, form]);

  // Clean up holds on unmount
  useEffect(() => {
    return () => {
      if (activeHoldId) {
        const sessionId = localStorage.getItem('karaoke_session_id') || '';
        if (sessionId) {
          releaseHold.mutate({ holdId: activeHoldId, sessionId });
        }
      }
    };
  }, [activeHoldId]);

  const handleTimeSlotSelect = (slotStart: string, slotEnd: string) => {
    form.setValue('startTime', slotStart);
    form.setValue('endTime', slotEnd);
    // Clear booth selection when time changes
    form.setValue('karaokeBoothId', '');
    // Release previous hold if exists
    if (activeHoldId) {
      const sessionId = localStorage.getItem('karaoke_session_id') || '';
      if (sessionId) {
        releaseHold.mutate({ holdId: activeHoldId, sessionId });
      }
      setActiveHoldId(null);
      setHoldExpiresAt(null);
    }
  };

  const handleBoothSelect = (boothId: string) => {
    // Release previous hold
    if (activeHoldId) {
      const sessionId = localStorage.getItem('karaoke_session_id') || '';
      if (sessionId) {
        releaseHold.mutate({ holdId: activeHoldId, sessionId });
      }
      setActiveHoldId(null);
      setHoldExpiresAt(null);
    }

    // Create new hold
    const sessionId = localStorage.getItem('karaoke_session_id') || crypto.randomUUID();
    localStorage.setItem('karaoke_session_id', sessionId);

    createHold.mutate({
      boothId,
      venue,
      bookingDate,
      startTime: startTime || '18:00',
      endTime: endTime || '19:00',
      sessionId,
      customerEmail: form.getValues('customerEmail') || undefined,
      ttlMinutes: 10,
    }, {
      onSuccess: (res: HoldResponse) => {
        setActiveHoldId(res.hold?.id || null);
        setHoldExpiresAt(res.hold?.expires_at || null);
      }
    });
  };

  const onSubmit = async (data: UnifiedBookingFormValues) => {
    try {
      if (data.bookingType === 'karaoke_booking') {
        if (!activeHoldId) {
          toast({ 
            title: 'Hold required', 
            description: 'Select a time slot and booth to create a hold before confirming.', 
            variant: 'destructive' 
          });
          return;
        }
        // Finalize from hold - use selected customer data if available
        const sessionId = localStorage.getItem('karaoke_session_id') || '';
        const customerName = selectedCustomer?.name || data.customerName || "";
        const customerEmail = selectedCustomer?.email || data.customerEmail || undefined;
        const customerPhone = selectedCustomer?.phone || data.customerPhone || undefined;
        
        if (!customerName) {
          toast({
            title: "Customer required",
            description: "Please select a customer or enter customer name",
            variant: "destructive",
          });
          return;
        }
        
        await finalizeHold.mutateAsync({
          holdId: activeHoldId,
          sessionId,
          customerName,
          customerEmail,
          customerPhone,
          guestCount: data.guestCount ? parseInt(data.guestCount) : undefined,
        });
      } else {
        // Get customer data - use selected customer if available, otherwise use form data
        const customerName = selectedCustomer?.name || data.customerName || "";
        const customerEmail = selectedCustomer?.email || data.customerEmail || undefined;
        const customerPhone = selectedCustomer?.phone || data.customerPhone || undefined;
        
        if (!customerName) {
          toast({
            title: "Customer required",
            description: "Please select a customer or enter customer name",
            variant: "destructive",
          });
          return;
        }
        
        await createBookingMutation.mutateAsync({
          customerName,
          customerEmail,
          customerPhone,
          bookingType: data.bookingType!,
          venue: data.venue!,
          venueArea: data.venueArea,
          karaokeBoothId: data.karaokeBoothId || undefined,
          bookingDate: data.bookingDate,
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
          guestCount: data.guestCount ? parseInt(data.guestCount) : undefined,
          ticketQuantity: data.ticketQuantity ? parseInt(data.ticketQuantity) : undefined,
          specialRequests: data.specialRequests || undefined,
          totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
          costPerTicket: data.costPerTicket ? parseFloat(data.costPerTicket) : undefined,
          staffNotes: data.staffNotes || undefined,
        });
      }
      
      form.reset();
      setActiveHoldId(null);
      setHoldExpiresAt(null);
      onClose();
      onSuccess?.();
    } catch (_error) {
      // Silent fail for booking creation
    }
  };

  const handleClose = () => {
    // Release hold on close
    if (activeHoldId) {
      const sessionId = localStorage.getItem('karaoke_session_id') || '';
      if (sessionId) {
        releaseHold.mutate({ holdId: activeHoldId, sessionId });
      }
      setActiveHoldId(null);
      setHoldExpiresAt(null);
    }
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[625px] sm:w-[844px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Edit Booking" : "Create New Booking"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Update the details for this booking." : "Enter the details for the new booking."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={["customer", "booking", "additional"]} className="w-full">
              {/* Customer Information Section */}
              <AccordionItem value="customer">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Customer Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CustomerDetailsSection control={form.control} form={form} hideHeader />
                </AccordionContent>
              </AccordionItem>

              {/* Booking Details Section - Date, Time, Venue, Booking Type, and Options */}
              <AccordionItem value="booking">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Booking Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <BookingDetailsSection
                    control={form.control}
                    bookingType={bookingType}
                    venue={venue}
                    bookingDate={bookingDate}
                    startTime={startTime}
                    endTime={endTime}
                    venueAvailability={venueAvailability}
                    onTimeSlotSelect={handleTimeSlotSelect}
                    hideHeader
                  />
                  {/* Hold status for karaoke */}
                  {bookingType === "karaoke_booking" && activeHoldId && holdExpiresAt && (
                    <div className="mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                      Hold expires at: {new Date(holdExpiresAt).toLocaleTimeString()}
                    </div>
                  )}
                  {/* Booking Options Section - Booth, Tickets, Guests */}
                  <div className="mt-6">
                    <BookingOptionsSection
                      control={form.control}
                      bookingType={bookingType}
                      startTime={startTime}
                      endTime={endTime}
                      availableBoothsForSlot={availableBoothsForSlot}
                      availableKaraokeBooths={availableKaraokeBooths}
                      onBoothSelect={handleBoothSelect}
                      hideHeader
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Additional Details Section */}
              <AccordionItem value="additional">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Additional Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <AdditionalDetailsSection
                    control={form.control}
                    bookingType={bookingType}
                    hideHeader
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createBookingMutation.isPending || finalizeHold.isPending}
              >
                {createBookingMutation.isPending || finalizeHold.isPending 
                  ? "Creating..." 
                  : isEditing 
                    ? "Save Changes" 
                    : "Create Booking"
                }
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

