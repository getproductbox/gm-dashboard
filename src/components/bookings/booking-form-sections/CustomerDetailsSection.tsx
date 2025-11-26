import { useState, useEffect } from "react";
import { Control, useWatch, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedBookingFormValues } from "../UnifiedBookingSidePanel";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerRow } from "@/services/customerService";

interface CustomerDetailsSectionProps {
  control: Control<UnifiedBookingFormValues>;
  form: UseFormReturn<UnifiedBookingFormValues>;
  hideHeader?: boolean;
}

export const CustomerDetailsSection = ({ control, form, hideHeader }: CustomerDetailsSectionProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const customerId = useWatch({ control, name: "customerId" });
  const customerName = useWatch({ control, name: "customerName" });

  // Fetch customers for search
  const { data: customers = [] } = useCustomers({ search: searchQuery });

  // Find selected customer
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Reset to select mode when customerId is cleared
  useEffect(() => {
    if (!customerId && !customerName) {
      setIsAddingNew(false);
    }
  }, [customerId, customerName]);

  const handleSelectCustomer = (customer: CustomerRow) => {
    form.setValue("customerId", customer.id);
    form.setValue("customerName", customer.name || "");
    form.setValue("customerEmail", customer.email || "");
    form.setValue("customerPhone", customer.phone || "");
    
    setIsAddingNew(false);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAddNewCustomer = () => {
    form.setValue("customerId", "");
    form.setValue("customerName", "");
    form.setValue("customerEmail", "");
    form.setValue("customerPhone", "");
    setIsAddingNew(true);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClearSelection = () => {
    form.setValue("customerId", "");
    form.setValue("customerName", "");
    form.setValue("customerEmail", "");
    form.setValue("customerPhone", "");
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-4">
      {!hideHeader && <h3 className="font-medium border-b pb-2">Customer Information</h3>}
      
      {/* Customer Selector */}
      {!isAddingNew && (
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Customer *</FormLabel>
              <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "flex-1 justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {selectedCustomer ? (
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {selectedCustomer.name}
                            {selectedCustomer.email && (
                              <span className="text-muted-foreground text-sm">
                                ({selectedCustomer.email})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>Select customer...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search customers..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.name} ${customer.email || ""} ${customer.phone || ""}`}
                              onSelect={() => handleSelectCustomer(customer)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customer.id === field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                {(customer.email || customer.phone) && (
                                  <span className="text-xs text-muted-foreground">
                                    {customer.email || customer.phone}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddNewCustomer}
                  className="shrink-0"
                  title="Add New Customer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedCustomer && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="mt-2"
                >
                  Clear selection
                </Button>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Add New Customer Form */}
      {isAddingNew && (
        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Add New Customer</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingNew(false);
                form.setValue("customerName", "");
                form.setValue("customerEmail", "");
                form.setValue("customerPhone", "");
              }}
            >
              Cancel
            </Button>
          </div>

          <FormField
            control={control}
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
            control={control}
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
            control={control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="04..." {...field} />
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
