
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Eye, Plus } from "lucide-react";
import { Customer } from "@/data/mockData/customers";
import { CustomerProfilePanel } from "./CustomerProfilePanel";
import { format } from "date-fns";

interface CustomersTableProps {
  customers: Customer[];
  sortField: keyof Customer;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Customer) => void;
}

export const CustomersTable = ({ customers, sortField, sortDirection, onSort }: CustomersTableProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getSortIcon = (field: keyof Customer) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const handleViewProfile = (customer: Customer) => {
    console.log('View profile for:', customer.firstName, customer.lastName);
    setSelectedCustomer(customer);
    setIsPanelOpen(true);
  };

  const handleNewBooking = (customer: Customer) => {
    console.log('New booking for:', customer.firstName, customer.lastName);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedCustomer(null);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    console.log('Customer updated in table:', updatedCustomer);
    // In a real app, this would update the customers list
    setSelectedCustomer(updatedCustomer);
  };

  return (
    <div className="relative">
      <div className="bg-white dark:bg-gm-neutral-900 rounded-lg border border-gm-neutral-200 dark:border-gm-neutral-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800"
                onClick={() => onSort('firstName')}
              >
                <div className="flex items-center gap-1">
                  Name
                  {getSortIcon('firstName')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800"
                onClick={() => onSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800"
                onClick={() => onSort('phone')}
              >
                <div className="flex items-center gap-1">
                  Phone
                  {getSortIcon('phone')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800 text-center"
                onClick={() => onSort('totalBookings')}
              >
                <div className="flex items-center justify-center gap-1">
                  Total Bookings
                  {getSortIcon('totalBookings')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800"
                onClick={() => onSort('lastVisit')}
              >
                <div className="flex items-center gap-1">
                  Last Visit
                  {getSortIcon('lastVisit')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gm-neutral-50 dark:hover:bg-gm-neutral-800"
                onClick={() => onSort('customerSince')}
              >
                <div className="flex items-center gap-1">
                  Customer Since
                  {getSortIcon('customerSince')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-gm-neutral-25 dark:hover:bg-gm-neutral-800">
                <TableCell className="font-medium">
                  {customer.firstName} {customer.lastName}
                </TableCell>
                <TableCell className="text-gm-neutral-600">
                  {customer.email}
                </TableCell>
                <TableCell className="text-gm-neutral-600">
                  {customer.phone}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gm-primary-100 text-gm-primary-800">
                    {customer.totalBookings}
                  </span>
                </TableCell>
                <TableCell className="text-gm-neutral-600">
                  {formatDate(customer.lastVisit)}
                </TableCell>
                <TableCell className="text-gm-neutral-600">
                  {formatDate(customer.customerSince)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(customer)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNewBooking(customer)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Book
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomerProfilePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        customer={selectedCustomer}
        onEdit={handleCustomerUpdated}
      />
    </div>
  );
};
