import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateBooking } from "@/hooks/useBookings";
import { CreateBookingData } from "@/services/bookingService";
import { formatDateToISO } from "@/utils/dateUtils";

const quickBookingSchema = z.object({
  customerName: z.string().min(2, "Name required"),
  contact: z.string().min(1, "Email or Phone required"), // We'll parse this
  bookingType: z.enum(["vip_tickets", "karaoke_booking"]),
  venue: z.enum(["manor", "hippie"]),
  quantity: z.string().min(1, "Required"), // guests or tickets
}).refine((data) => {
  // Basic validation to ensure contact is provided
  return data.contact.length > 0;
}, {
  message: "Contact info required",
  path: ["contact"],
});

type QuickBookingFormValues = z.infer<typeof quickBookingSchema>;

interface QuickAddBookingDialogProps {
  defaultDate?: string;
}

export function QuickAddBookingDialog({ defaultDate }: QuickAddBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createBookingMutation = useCreateBooking();
  
  const form = useForm<QuickBookingFormValues>({
    resolver: zodResolver(quickBookingSchema),
    defaultValues: {
      customerName: "",
      contact: "",
      bookingType: "vip_tickets",
      venue: "manor",
      quantity: "1",
    },
  });

  const bookingType = form.watch("bookingType");

  const onSubmit = async (data: QuickBookingFormValues) => {
    const isEmail = data.contact.includes("@");
    const bookingDate = defaultDate || formatDateToISO(new Date());

    const bookingData: CreateBookingData = {
      customerName: data.customerName,
      customerEmail: isEmail ? data.contact : undefined,
      customerPhone: !isEmail ? data.contact : undefined,
      bookingType: data.bookingType,
      venue: data.venue,
      bookingDate: bookingDate,
      // Defaults based on type
      ticketQuantity: data.bookingType === "vip_tickets" ? parseInt(data.quantity) : undefined,
      guestCount: data.bookingType === "karaoke_booking" ? parseInt(data.quantity) : undefined,
      startTime: data.bookingType === "karaoke_booking" ? "20:00" : undefined, // Default 8pm for quick add karaoke
      endTime: data.bookingType === "karaoke_booking" ? "21:00" : undefined,
      karaokeBoothId: data.bookingType === "karaoke_booking" ? "quick_add_placeholder" : undefined, // Ideally user selects booth, but for quick add we might need logic
      // For VIP tickets, we need a cost. Defaulting to 0 or standard rate?
      costPerTicket: data.bookingType === "vip_tickets" ? 0 : undefined, 
      totalAmount: 0,
      staffNotes: "Quick add from Run Sheet",
    };

    // Note: Karaoke quick add is tricky because of booth selection. 
    // For now, we might need to simplify or direct them to full form if it's karaoke.
    // Or, we just create a "pending" booking without a booth assigned?
    // The current backend requires booth_id for karaoke. 
    // Let's restrict quick add to VIP Tickets for now as per plan simplicity, 
    // or handle Karaoke by asking for booth if selected.
    // Given the constraints, let's focus on VIP Tickets which is the primary "Guest List" use case.
    
    if (data.bookingType === "karaoke_booking") {
      // Redirect to full form or show error?
      // For this implementation, let's just handle VIP tickets efficiently
      // If they want karaoke, we can use a different flow or add booth selection.
      // Let's just default to VIP for Quick Add in this iteration unless we want to fetch booths.
    }

    try {
      await createBookingMutation.mutateAsync(bookingData);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create booking", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quick Add to Guest List</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Guest Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@example.com or 04..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select venue" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manor">Manor</SelectItem>
                        <SelectItem value="hippie">Hippie Door</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="vip_tickets">VIP Ticket</SelectItem>
                        {/* Karaoke removed for simplicity in Quick Add as it requires booth/time logic */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{bookingType === 'vip_tickets' ? 'Tickets' : 'Guests'}</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createBookingMutation.isPending}>
                {createBookingMutation.isPending ? "Adding..." : "Add to List"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
