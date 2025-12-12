import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Edit, X, Calendar, MapPin, Users, Ticket, DollarSign, Clock, Calendar as CalendarIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateToISO } from "@/utils/dateUtils";
import { BookingRow } from "@/services/bookingService";
import { useUpdateBooking } from "@/hooks/useBookings";
import { useKaraokeBooth } from "@/hooks/useKaraoke";
import { supabase } from "@/integrations/supabase/client";

const bookingUpdateSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  customerPhone: z.string().min(1, "Please enter a phone number").optional().or(z.literal("")),
  bookingType: z.enum(["venue_hire", "vip_tickets", "karaoke_booking"]),
  venue: z.enum(["manor", "hippie"]),
  venueArea: z.enum(["upstairs", "downstairs", "full_venue", "karaoke"]).optional(),
  bookingDate: z.string().min(1, "Please select a date"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  guestCount: z.string().optional(),
  ticketQuantity: z.string().optional(),
  specialRequests: z.string().optional(),
  totalAmount: z.string().optional(),
  staffNotes: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
}).refine((data) => {
  return data.customerEmail || data.customerPhone;
}, {
  message: "Please provide either email or phone number",
  path: ["customerEmail"],
});

type BookingUpdateFormValues = z.infer<typeof bookingUpdateSchema>;

interface BookingDetailsSidebarProps {
  booking: BookingRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingDetailsSidebar = ({ booking, isOpen, onClose }: BookingDetailsSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateBookingMutation = useUpdateBooking();
  
  // Fetch karaoke booth details if this is a karaoke booking
  const { data: karaokeBoothData } = useKaraokeBooth(
    booking?.karaoke_booth_id || ""
  );

  // Helper function to determine if booking is a karaoke booking
  const isKaraokeBooking = (bookingData: BookingRow) => {
    return bookingData.booking_type === 'karaoke_booking' || 
           (bookingData.booking_type === 'venue_hire' && bookingData.venue_area === 'karaoke');
  };

  // Helper function to get display booking type
  const getDisplayBookingType = (bookingData: BookingRow) => {
    if (bookingData.booking_type === 'karaoke_booking') {
      return 'karaoke_booking';
    }
    if (bookingData.booking_type === 'venue_hire' && bookingData.venue_area === 'karaoke') {
      return 'karaoke_booking'; // Fallback for old records
    }
    return bookingData.booking_type;
  };

  const form = useForm<BookingUpdateFormValues>({
    resolver: zodResolver(bookingUpdateSchema),
    defaultValues: {
      customerName: booking?.customer_name || "",
      customerEmail: booking?.customer_email || "",
      customerPhone: booking?.customer_phone || "",
      bookingType: booking ? getDisplayBookingType(booking) as "venue_hire" | "vip_tickets" | "karaoke_booking" : "venue_hire",
      venue: booking?.venue as "manor" | "hippie",
      venueArea: booking?.venue_area as "upstairs" | "downstairs" | "full_venue" | "karaoke" | undefined,
      bookingDate: booking?.booking_date || "",
      startTime: booking?.start_time || "",
      endTime: booking?.end_time || "",
      guestCount: booking?.guest_count?.toString() || "",
      ticketQuantity: booking?.ticket_quantity?.toString() || "",
      specialRequests: booking?.special_requests || "",
      totalAmount: booking?.total_amount?.toString() || "",
      staffNotes: booking?.staff_notes || "",
      status: booking?.status as "pending" | "confirmed" | "cancelled" | "completed",
    },
  });

  // Update form when booking changes
  useEffect(() => {
    if (booking) {
      form.reset({
        customerName: booking.customer_name,
        customerEmail: booking.customer_email || "",
        customerPhone: booking.customer_phone || "",
        bookingType: getDisplayBookingType(booking) as "venue_hire" | "vip_tickets" | "karaoke_booking",
        venue: booking.venue as "manor" | "hippie",
        venueArea: booking.venue_area as "upstairs" | "downstairs" | "full_venue" | "karaoke" | undefined,
        bookingDate: booking.booking_date,
        startTime: booking.start_time || "",
        endTime: booking.end_time || "",
        guestCount: booking.guest_count?.toString() || "",
        ticketQuantity: booking.ticket_quantity?.toString() || "",
        specialRequests: booking.special_requests || "",
        totalAmount: booking.total_amount?.toString() || "",
        staffNotes: booking.staff_notes || "",
        status: booking.status as "pending" | "confirmed" | "cancelled" | "completed",
      });
    }
  }, [booking, form]);

  const bookingType = form.watch("bookingType");

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (booking) {
      form.reset({
        customerName: booking.customer_name,
        customerEmail: booking.customer_email || "",
        customerPhone: booking.customer_phone || "",
        bookingType: getDisplayBookingType(booking) as "venue_hire" | "vip_tickets" | "karaoke_booking",
        venue: booking.venue as "manor" | "hippie",
        venueArea: booking.venue_area as "upstairs" | "downstairs" | "full_venue" | "karaoke" | undefined,
        bookingDate: booking.booking_date,
        startTime: booking.start_time || "",
        endTime: booking.end_time || "",
        guestCount: booking.guest_count?.toString() || "",
        ticketQuantity: booking.ticket_quantity?.toString() || "",
        specialRequests: booking.special_requests || "",
        totalAmount: booking.total_amount?.toString() || "",
        staffNotes: booking.staff_notes || "",
        status: booking.status as "pending" | "confirmed" | "cancelled" | "completed",
      });
    }
  };

  const onSubmit = async (data: BookingUpdateFormValues) => {
    if (!booking) return;

    try {
      // Handle booking type conversion based on what we're editing
      let actualBookingType = data.bookingType;
      let actualVenueArea: 'upstairs' | 'downstairs' | 'full_venue' | 'karaoke' | undefined = data.venueArea;
      
      // For new karaoke bookings, use proper karaoke_booking type
      if (data.bookingType === 'karaoke_booking') {
        actualBookingType = 'karaoke_booking';
        actualVenueArea = undefined; // Not needed for karaoke bookings
      }

      await updateBookingMutation.mutateAsync({
        id: booking.id,
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail || undefined,
          customerPhone: data.customerPhone || undefined,
          bookingType: actualBookingType as 'venue_hire' | 'vip_tickets' | 'karaoke_booking',
          venue: data.venue,
          venueArea: actualVenueArea,
          bookingDate: data.bookingDate,
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
          guestCount: data.guestCount ? parseInt(data.guestCount) : undefined,
          ticketQuantity: data.ticketQuantity ? parseInt(data.ticketQuantity) : undefined,
          specialRequests: data.specialRequests || undefined,
          totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
          staffNotes: data.staffNotes || undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    // Convert from GST inclusive to GST exclusive by dividing by 1.1
    const gstExclusiveAmount = amount / 1.1;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(gstExclusiveAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatVenue = (venue: string) => {
    return venue === 'manor' ? 'Manor' : 'Hippie Club';
  };

  const formatBookingType = (type: string, venueArea?: string | null) => {
    if (type === 'karaoke_booking') {
      return 'Karaoke Booking';
    }
    if (type === 'venue_hire' && venueArea === 'karaoke') {
      return 'Karaoke Booking'; // Fallback for old records
    }
    return type === 'venue_hire' ? 'Venue Hire' : 'VIP Tickets';
  };

  const formatVenueArea = (area: string | null) => {
    if (!area) return '';
    if (area === 'karaoke') return 'Karaoke';
    return area.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!booking) return null;

  const karaokeBooking = isKaraokeBooking(booking);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[600px] max-w-none overflow-y-auto" hideCloseButton>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
            <SheetHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-xl font-bold">Booking Details</SheetTitle>
                  <SheetDescription>
                    {formatBookingType(booking.booking_type, booking.venue_area)} • {formatVenue(booking.venue)}
                  </SheetDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </div>
              
              {/* Status Section */}
              <div>
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 mt-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{booking.customer_name}</span>
                      </div>
                      {booking.customer_email && (
                        <div className="text-sm text-gray-600">
                          📧 {booking.customer_email}
                        </div>
                      )}
                      {booking.customer_phone && (
                        <div className="text-sm text-gray-600">
                          📞 {booking.customer_phone}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="venue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Venue</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="manor">Manor</SelectItem>
                                  <SelectItem value="hippie">Hippie Club</SelectItem>
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
                              <FormLabel>Booking Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="venue_hire">Venue Hire</SelectItem>
                                  <SelectItem value="vip_tickets">VIP Tickets</SelectItem>
                                  <SelectItem value="karaoke_booking">Karaoke Booking</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {bookingType === "venue_hire" && (
                        <FormField
                          control={form.control}
                          name="venueArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Venue Area</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="upstairs">Upstairs</SelectItem>
                                  <SelectItem value="downstairs">Downstairs</SelectItem>
                                  <SelectItem value="full_venue">Full Venue</SelectItem>
                                  <SelectItem value="karaoke">Karaoke</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="bookingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
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
                                <CalendarComponent
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
                      {bookingType === "venue_hire" && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {(bookingType === "venue_hire" || bookingType === "karaoke_booking") && (
                          <FormField
                            control={form.control}
                            name="guestCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Guest Count</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {bookingType === "vip_tickets" && (
                          <FormField
                            control={form.control}
                            name="ticketQuantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ticket Quantity</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={form.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Amount</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{formatVenue(booking.venue)}</span>
                        {booking.venue_area && (
                          <span className="text-sm text-gray-600">
                            • {formatVenueArea(booking.venue_area)}
                          </span>
                        )}
                      </div>
                      {booking.karaoke_booth_id && karaokeBoothData && (
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{karaokeBoothData.name}</span>
                          <span className="text-sm text-gray-600">
                            • £{karaokeBoothData.hourly_rate}/hour
                          </span>
                        </div>
                      )}
                      {booking.start_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{booking.start_time}</span>
                          {booking.end_time && (
                            <span className="text-gray-600"> - {booking.end_time}</span>
                          )}
                        </div>
                      )}
                      {booking.guest_count && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{booking.guest_count} guests</span>
                        </div>
                      )}
                      {booking.ticket_quantity && (
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-gray-500" />
                          <span>{booking.ticket_quantity} tickets</span>
                        </div>
                      )}
                      {booking.total_amount && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatCurrency(booking.total_amount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information - only show for non-VIP bookings */}
              {(bookingType !== "vip_tickets" || (booking.special_requests || booking.staff_notes)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <FormField
                          control={form.control}
                          name="specialRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Requests</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="staffNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Staff Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="space-y-3">
                        {booking.special_requests && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">Special Requests</h4>
                            <p className="text-sm text-gray-600">{booking.special_requests}</p>
                          </div>
                        )}
                        {booking.staff_notes && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">Staff Notes</h4>
                            <p className="text-sm text-gray-600">{booking.staff_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Karaoke guest list (read-only for staff) */}
              {karaokeBooking && (
                <KaraokeGuestListPanel bookingId={booking.id} />
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateBookingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBookingMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateBookingMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}; 

interface KaraokeGuestListPanelProps {
  bookingId: string;
}

const KaraokeGuestListPanel = ({ bookingId }: KaraokeGuestListPanelProps) => {
  const [guestNames, setGuestNames] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch guest names directly from the table
        const { data: guestRows, error: guestsError } = await supabase
          .from("booking_guests")
          .select("guest_name")
          .eq("booking_id", bookingId)
          .order("created_at");

        if (guestsError) throw guestsError;

        const guests = (guestRows || []).map((r: { guest_name: string }) => r.guest_name);
        if (!cancelled) {
          setGuestNames(guests);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg || "Failed to load guest list");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="h-4 w-4 text-orange-500" />
          Karaoke Guest List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading guest list…</p>}
        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!loading && !error && (
          <>
            {guestNames && guestNames.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {guestNames.map((name, idx) => (
                  <li key={`${bookingId}-guest-${idx}`} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No guests have been added yet. The customer can curate their guest list from their confirmation email link.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
