import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarResource } from "@/data/mockData/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  guests: z.coerce.number().min(1, "Must have at least 1 guest"),
  service: z.enum(["Karaoke", "Venue Hire"]),
  resourceId: z.string().min(1, "Please select a resource"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface CreateBookingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  resources: CalendarResource[];
  initialData?: Partial<BookingFormValues> | null;
}

export const CreateBookingSidebar = ({
  isOpen,
  onClose,
  resources,
  initialData,
}: CreateBookingSidebarProps) => {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "10:00",
      endTime: "11:00",
      guests: 1,
      service: "Karaoke",
      resourceId: "",
    },
  });

  // Update form when initialData changes or sidebar opens
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        customerName: "",
        customerPhone: "",
        date: initialData.date || format(new Date(), "yyyy-MM-dd"),
        startTime: initialData.startTime || "10:00",
        endTime: initialData.endTime || "11:00",
        guests: 1,
        service: initialData.service || "Karaoke",
        resourceId: initialData.resourceId || "",
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (data: BookingFormValues) => {
    console.log("📝 Creating new booking:", data);
    // Here you would call your API to create the booking
    onClose();
    form.reset();
  };

  // Filter resources based on service type
  const serviceType = form.watch("service");
  const filteredResources = resources.filter((r) => {
    if (serviceType === "Karaoke") return r.type === "karaoke";
    if (serviceType === "Venue Hire") return r.type === "venue";
    return true;
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Create New Booking</SheetTitle>
          <SheetDescription>
            Enter the details for the new booking.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Details</h3>
              
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+44..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Count</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium border-b pb-2">Resource</h3>

              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Reset resource when service changes as the list changes
                        form.setValue("resourceId", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Karaoke">Karaoke</SelectItem>
                        <SelectItem value="Venue Hire">Venue Hire</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resource" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredResources.map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>
                            {resource.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Booking</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

