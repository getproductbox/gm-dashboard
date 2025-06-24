
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Edit, Mail, Calendar, Archive, Users } from "lucide-react";
import { Customer } from "@/data/mockData/customers";
import { CustomerInfo } from "./CustomerInfo";
import { BookingHistory } from "./BookingHistory";
import { CustomerActions } from "./CustomerActions";
import { CustomerEditForm } from "./CustomerEditForm";
import { getDetailedCustomerData } from "@/data/mockData/customers";

interface CustomerProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onCustomerUpdated?: (customer: Customer) => void;
}

export const CustomerProfilePanel = ({ 
  isOpen, 
  onClose, 
  customerId,
  onCustomerUpdated 
}: CustomerProfilePanelProps) => {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId && isOpen) {
      loadCustomerData(customerId);
    }
  }, [customerId, isOpen]);

  const loadCustomerData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const detailedCustomer = getDetailedCustomerData(id);
      
      if (!detailedCustomer) {
        setError("Customer not found");
      } else {
        setCustomer(detailedCustomer);
      }
    } catch (err) {
      setError("Failed to load customer data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    setCustomer({ ...customer, ...updatedCustomer });
    setIsEditMode(false);
    onCustomerUpdated?.(updatedCustomer);
    console.log('Customer updated:', updatedCustomer);
  };

  const handleCreateBooking = () => {
    console.log('Create new booking for customer:', customer?.firstName, customer?.lastName);
    onClose();
  };

  const handleSendEmail = () => {
    console.log('Send email to:', customer?.email);
  };

  const handleArchiveCustomer = () => {
    console.log('Archive customer:', customer?.firstName, customer?.lastName);
    onClose();
  };

  const handleMergeDuplicate = () => {
    console.log('Merge duplicate customer:', customer?.firstName, customer?.lastName);
  };

  const handleViewAllBookings = () => {
    console.log('View all bookings for:', customer?.firstName, customer?.lastName);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : error ? (
                <div>
                  <SheetTitle className="text-red-600">Error</SheetTitle>
                  <p className="text-sm text-gm-neutral-600">{error}</p>
                </div>
              ) : customer ? (
                <div>
                  <SheetTitle className="text-xl">
                    {customer.firstName} {customer.lastName}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === 'returning' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.status === 'returning' ? 'Returning Customer' : 'First-time Customer'}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditToggle}
              className="flex items-center gap-2"
              disabled={isLoading || error || !customer}
            >
              <Edit className="h-4 w-4" />
              {isEditMode ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-gm-neutral-600">Failed to load customer information</p>
              <Button 
                variant="outline" 
                onClick={() => customerId && loadCustomerData(customerId)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : customer ? (
            <>
              {isEditMode ? (
                <CustomerEditForm
                  customer={customer}
                  onSave={handleSaveCustomer}
                  onCancel={() => setIsEditMode(false)}
                />
              ) : (
                <>
                  <CustomerInfo customer={customer} />
                  <BookingHistory 
                    bookings={customer.bookingHistory || []}
                    onViewAll={handleViewAllBookings}
                  />
                  <CustomerActions
                    onCreateBooking={handleCreateBooking}
                    onSendEmail={handleSendEmail}
                    onArchiveCustomer={handleArchiveCustomer}
                    onMergeDuplicate={handleMergeDuplicate}
                    onViewAllBookings={handleViewAllBookings}
                  />
                </>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
