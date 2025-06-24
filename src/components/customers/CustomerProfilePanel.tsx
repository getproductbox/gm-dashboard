
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
          className="absolute inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel - Container relative positioning */}
      <div className={`
        absolute top-0 right-0 h-full bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-[400px] max-w-[45%]
        min-w-[320px]
        overflow-hidden
      `}>
        <div className="flex flex-col h-full">
          {/* Header - Compact and responsive */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-base sm:text-lg font-bold text-gm-neutral-900 truncate">
                {customerName}
              </h2>
              <p className="text-xs sm:text-sm text-gm-neutral-600 truncate">
                Since {new Date(customer.customerSince).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full flex-shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content - Scrollable with constrained width */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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

          {/* Actions - Fixed bottom with compact spacing */}
          {!isEditing && (
            <div className="border-t p-3 sm:p-4 bg-white">
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
