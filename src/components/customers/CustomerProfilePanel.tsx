
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerInfo } from './CustomerInfo';
import { BookingHistory } from './BookingHistory';
import { CustomerActions } from './CustomerActions';
import { CustomerEditForm } from './CustomerEditForm';
import { Customer, getDetailedCustomerData } from '@/data/mockData/customers';

interface CustomerProfilePanelProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerProfilePanel = ({
  customer,
  isOpen,
  onClose,
  onEdit
}: CustomerProfilePanelProps) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!customer) return null;

  const customerName = `${customer.firstName} ${customer.lastName}`;
  const detailedCustomer = getDetailedCustomerData(customer.id);

  const handleEdit = (updatedCustomer: Customer) => {
    onEdit(updatedCustomer);
    setIsEditing(false);
  };

  const handleCreateBooking = () => {
    console.log('Create booking for customer:', customerName);
  };

  const handleSendEmail = () => {
    console.log('Send email to:', customer.email);
  };

  const handleArchiveCustomer = () => {
    console.log('Archive customer:', customerName);
  };

  const handleMergeDuplicate = () => {
    console.log('Merge duplicate customer:', customerName);
  };

  const handleViewAllBookings = () => {
    console.log('View all bookings for:', customerName);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel - Responsive width that adapts to sidebar */}
      <div className={`
        fixed top-0 right-0 h-full bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-full sm:w-[90vw] md:w-[70vw] lg:w-[50vw] xl:w-[40vw] 
        max-w-2xl min-w-[320px]
      `}>
        <div className="flex flex-col h-full">
          {/* Header - Responsive padding and text sizing */}
          <div className="flex items-start justify-between p-4 sm:p-6 border-b">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gm-neutral-900 truncate">
                {customerName}
              </h2>
              <p className="text-sm sm:text-base text-gm-neutral-600 truncate">
                Customer since {new Date(customer.customerSince).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content - Scrollable with responsive padding */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {isEditing ? (
                <CustomerEditForm
                  customer={customer}
                  onSave={handleEdit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <CustomerInfo customer={detailedCustomer || customer} />
                  <BookingHistory 
                    bookings={detailedCustomer?.bookingHistory || []} 
                    onViewAll={handleViewAllBookings}
                  />
                </>
              )}
            </div>
          </div>

          {/* Actions - Fixed bottom with responsive padding */}
          {!isEditing && (
            <div className="border-t p-4 sm:p-6 bg-white">
              <CustomerActions
                onCreateBooking={handleCreateBooking}
                onSendEmail={handleSendEmail}
                onEditCustomer={() => setIsEditing(true)}
                onArchiveCustomer={handleArchiveCustomer}
                onMergeDuplicate={handleMergeDuplicate}
                onViewAllBookings={handleViewAllBookings}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
