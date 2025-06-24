
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
import { Save } from "lucide-react";
import { useCreateBooking } from "@/hooks/useBookings";

const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  customerPhone: z.string().min(1, "Please enter a phone number").optional().or(z.literal("")),
  bookingType: z.enum(["venue_hire", "vip_tickets"], {
    required_error: "Please select a booking type"
  }),
  venue: z.enum(["manor", "hippie"], {
    required_error: "Please select a venue"
  }),
  venueArea: z.enum(["upstairs", "downstairs", "full_venue"]).optional(),
  bookingDate: z.string().min(1, "Please select a date"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  guestCount: z.string().min(1, "Please specify number of guests"),
  ticketQuantity: z.string().optional(),
  specialRequests: z.string().optional(),
  totalAmount: z.string().optional(),
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
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const venueOptions = [
  { value: "manor", label: "Manor" },
  { value: "hippie", label: "Hippie Club" },
];

const bookingTypeOptions = [
  { value: "venue_hire", label: "Venue Hire" },
  { value: "vip_tickets", label: "VIP Tickets" },
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

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookingType: undefined,
      venue: undefined,
      venueArea: undefined,
      bookingDate: "",
      startTime: "",
      endTime: "",
      guestCount: "1",
      ticketQuantity: "",
      specialRequests: "",
      totalAmount: "",
      staffNotes: "",
    },
  });

  const bookingType = form.watch("bookingType");

  const onSubmit = async (data: BookingFormValues) => {
    try {
      await createBookingMutation.mutateAsync({
        customerName: data.customerName,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        bookingType: data.bookingType,
        venue: data.venue,
        venueArea: data.venueArea,
        bookingDate: data.bookingDate,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        durationHours: undefined, // Let backend calculate from start/end times
        guestCount: parseInt(data.guestCount),
        ticketQuantity: data.ticketQuantity ? parseInt(data.ticketQuantity) : undefined,
        specialRequests: data.specialRequests || undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
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

              {/* Show booking date only after booking type is selected */}
              {bookingType && (
                <FormField
                  control={form.control}
                  name="bookingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <FormLabel>End Time</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount (£)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" placeholder="e.g. 120.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
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
