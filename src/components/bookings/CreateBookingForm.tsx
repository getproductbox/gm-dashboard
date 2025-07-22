import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Save, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateToISO } from "@/utils/dateUtils";
import { useCreateBooking } from "@/hooks/useBookings";
import { useKaraokeBooths } from "@/hooks/useKaraoke";
import { BookingCalendarView } from "./BookingCalendarView";

const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  customerPhone: z.string().min(1, "Please enter a phone number").optional().or(z.literal("")),
  bookingType: z.enum(["venue_hire", "vip_tickets", "karaoke_booking"], {
    required_error: "Please select a booking type"
  }),
  venue: z.enum(["manor", "hippie"], {
    required_error: "Please select a venue"
  }),
  venueArea: z.enum(["upstairs", "downstairs", "full_venue"]).optional(),
  karaokeBoothId: z.string().optional(), // For karaoke bookings
  bookingDate: z.string().min(1, "Please select a date"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  guestCount: z.string().optional(),
  ticketQuantity: z.string().optional(),
  specialRequests: z.string().optional(),
  totalAmount: z.string().optional(),
  costPerTicket: z.string().optional(),
  staffNotes: z.string().optional(),
}).refine((data) => {
  // At least one contact method required
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
  // Guest count required for venue hire
  if (data.bookingType === "venue_hire" && !data.guestCount) {
    return false;
  }
  return true;
}, {
  message: "Please specify number of guests for venue hire bookings",
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
}).refine((data) => {
  // Start and end time required for karaoke bookings
  if (data.bookingType === "karaoke_booking" && (!data.startTime || !data.endTime)) {
    return false;
  }
  return true;
}, {
  message: "Please specify start and end times for karaoke bookings",
  path: ["startTime"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

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

export const CreateBookingForm = () => {
  const navigate = useNavigate();
  const createBookingMutation = useCreateBooking();
  const { data: karaokeBooths } = useKaraokeBooths();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookingType: undefined,
      venue: undefined,
      venueArea: undefined,
      karaokeBoothId: undefined,
      bookingDate: "",
      startTime: "",
      endTime: "",
      guestCount: "1",
      ticketQuantity: "",
      specialRequests: "",
      totalAmount: "",
      costPerTicket: "",
      staffNotes: "",
    },
  });

  const bookingType = form.watch("bookingType");
  const venue = form.watch("venue");
  const ticketQuantity = form.watch("ticketQuantity");
  const costPerTicket = form.watch("costPerTicket");
  const karaokeBoothId = form.watch("karaokeBoothId");
  const bookingDate = form.watch("bookingDate");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  // Filter karaoke booths based on selected venue
  const availableKaraokeBooths = karaokeBooths?.filter(booth => 
    !venue || booth.venue === venue
  ) || [];

  // Get selected booth for dynamic time slots
  const selectedBooth = availableKaraokeBooths.find(booth => booth.id === karaokeBoothId);

  // Generate time slots based on booth operating hours
  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = [];
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    for (let time = new Date(start); time <= end; time.setMinutes(time.getMinutes() + 30)) {
      const timeStr = time.toTimeString().slice(0, 5);
      slots.push(timeStr);
    }
    
    return slots;
  };

  // Available time slots based on selected booth or default
  const availableTimeSlots = selectedBooth && selectedBooth.operating_hours_start && selectedBooth.operating_hours_end
    ? generateTimeSlots(selectedBooth.operating_hours_start, selectedBooth.operating_hours_end)
    : timeSlots;

  // Calendar event handlers
  const handleDateSelect = (date: string) => {
    form.setValue("bookingDate", date);
  };

  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    form.setValue("startTime", startTime);
    form.setValue("endTime", endTime);
  };

  // Calculate total amount for VIP tickets
  const calculateTotalAmount = () => {
    if (bookingType === "vip_tickets" && ticketQuantity && costPerTicket) {
      const quantity = parseInt(ticketQuantity);
      const cost = parseFloat(costPerTicket);
      if (!isNaN(quantity) && !isNaN(cost)) {
        return (quantity * cost).toFixed(2);
      }
    }
    return "";
  };

  const onSubmit = async (data: BookingFormValues) => {
    try {
      await createBookingMutation.mutateAsync({
        customerName: data.customerName,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        bookingType: data.bookingType,
        venue: data.venue,
        venueArea: data.venueArea,
        karaokeBoothId: data.karaokeBoothId || undefined,
        bookingDate: data.bookingDate,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        durationHours: undefined, // Let backend calculate from start/end times
        guestCount: data.guestCount ? parseInt(data.guestCount) : undefined,
        ticketQuantity: data.ticketQuantity ? parseInt(data.ticketQuantity) : undefined,
        specialRequests: data.specialRequests || undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        costPerTicket: data.costPerTicket ? parseFloat(data.costPerTicket) : undefined,
        staffNotes: data.staffNotes || undefined,
      });
      
      navigate('/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="customer@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide either email or phone number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+44 123 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <FormField
                  control={form.control}
                  name="bookingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>

              {/* Show venue area only for venue hire */}
              {bookingType === "venue_hire" && (
                <FormField
                  control={form.control}
                  name="venueArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Area *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Show karaoke booth selection for karaoke bookings */}
              {bookingType === "karaoke_booking" && (
                <FormField
                  control={form.control}
                  name="karaokeBoothId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karaoke Booth *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select karaoke booth" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableKaraokeBooths.map((booth) => (
                            <SelectItem key={booth.id} value={booth.id}>
                              {booth.name} - {booth.venue} (£{booth.hourly_rate}/hour)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a karaoke booth for your booking
                        {selectedBooth && selectedBooth.operating_hours_start && selectedBooth.operating_hours_end && (
                          <span className="block text-sm text-blue-600 mt-1">
                            Operating hours: {selectedBooth.operating_hours_start} - {selectedBooth.operating_hours_end}
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Show booking date only after booking type is selected */}
              {bookingType && (
                <FormField
                  control={form.control}
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
              )}

              {/* Show calendar view for karaoke bookings */}
              {bookingType === "karaoke_booking" && selectedBooth && bookingDate && (
                <div className="col-span-2">
                  <BookingCalendarView
                    selectedBooth={selectedBooth}
                    selectedDate={bookingDate}
                    onDateSelect={handleDateSelect}
                    onTimeSlotSelect={handleTimeSlotSelect}
                    selectedStartTime={startTime}
                    selectedEndTime={endTime}
                  />
                </div>
              )}

              {/* Show time fields only for venue hire - just start and end time */}
              {bookingType === "venue_hire" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTimeSlots.map((time) => (
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
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTimeSlots.map((time) => (
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

              {/* Show time fields for karaoke bookings when calendar view is not available */}
              {bookingType === "karaoke_booking" && (!selectedBooth || !bookingDate) && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Show guest/ticket fields only after booking type is selected */}
              {bookingType && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Show guest count only for venue hire */}
                  {bookingType === "venue_hire" && (
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Guests *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="500" placeholder="e.g. 8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Show ticket quantity for VIP tickets */}
                  {bookingType === "vip_tickets" && (
                    <FormField
                      control={form.control}
                      name="ticketQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Quantity *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="100" placeholder="e.g. 4" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Show cost per ticket for VIP tickets, total amount for venue hire */}
                  {bookingType === "vip_tickets" ? (
                    <FormField
                      control={form.control}
                      name="costPerTicket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost per Ticket ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="e.g. 30.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="e.g. 120.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Show guest count for karaoke bookings */}
                  {bookingType === "karaoke_booking" && (
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Guests *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="20" placeholder="e.g. 6" {...field} />
                          </FormControl>
                          <FormDescription>
                            Number of people for your karaoke session
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Show calculated total for VIP tickets */}
              {bookingType === "vip_tickets" && ticketQuantity && costPerTicket && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${calculateTotalAmount()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information - only show for non-VIP bookings */}
        {bookingType && bookingType !== "vip_tickets" && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests / Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requirements, dietary restrictions, or additional notes..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Customer facing notes and special requirements
                    </FormDescription>
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
                      <Textarea
                        placeholder="Internal staff notes, reminders, or instructions..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal notes visible only to staff
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/bookings')}
            disabled={createBookingMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createBookingMutation.isPending}>
            {createBookingMutation.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Booking
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
