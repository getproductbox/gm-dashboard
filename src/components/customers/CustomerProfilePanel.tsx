
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerInfo } from './CustomerInfo';
import { BookingHistory } from './BookingHistory';
import { CustomerActions } from './CustomerActions';
import { CustomerEditForm } from './CustomerEditForm';
import { Customer } from '@/data/mockData/customers';

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

  const handleEdit = (updatedCustomer: Customer) => {
    onEdit(updatedCustomer);
    setIsEditing(false);
  };

  const handleCreateBooking = () => {
    console.log('Create booking for customer:', customer.name);
  };

  const handleSendEmail = () => {
    console.log('Send email to:', customer.email);
  };

  const handleArchiveCustomer = () => {
    console.log('Archive customer:', customer.name);
  };

  const handleMergeDuplicate = () => {
    console.log('Merge duplicate customer:', customer.name);
  };

  const handleViewAllBookings = () => {
    console.log('View all bookings for:', customer.name);
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

      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full md:w-2/5 bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gm-neutral-900">
                {customer.name}
              </h2>
              <p className="text-gm-neutral-600">
                Customer since {new Date(customer.customerSince).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {isEditing ? (
                <CustomerEditForm
                  customer={customer}
                  onSave={handleEdit}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <CustomerInfo customer={customer} />
                  <BookingHistory customer={customer} />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="border-t p-6">
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
