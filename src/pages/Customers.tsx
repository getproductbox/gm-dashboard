
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerFilters, CustomerFilterProps } from "@/components/customers/CustomerFilters";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerPagination } from "@/components/customers/CustomerPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, UserPlus, TrendingUp } from "lucide-react";
import { mockCustomers, mockCustomerStats, Customer } from "@/data/mockData/customers";

const Customers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof Customer>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<CustomerFilterProps>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter(customer => {
      const matchesSearch = !filters.search || 
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || customer.status === filters.status;
      
      const matchesDateFrom = !filters.dateFrom || customer.customerSince >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || customer.customerSince <= filters.dateTo;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [filters]);

  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'firstName':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        case 'totalBookings':
          aValue = a.totalBookings;
          bValue = b.totalBookings;
          break;
        case 'lastVisit':
          aValue = a.lastVisit;
          bValue = b.lastVisit;
          break;
        case 'customerSince':
          aValue = a.customerSince;
          bValue = b.customerSince;
          break;
        default:
          aValue = a.firstName;
          bValue = b.firstName;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    return sorted;
  }, [filteredCustomers, sortField, sortDirection]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCustomers.slice(startIndex, endIndex);
  }, [sortedCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

  const handleFiltersChange = (newFilters: Partial<CustomerFilterProps>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(1);
  };

  const handleAddCustomer = () => {
    console.log('Add new customer clicked');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gm-neutral-900 dark:text-white">Customers</h1>
            <p className="text-gm-neutral-600 dark:text-gm-neutral-400">
              {mockCustomerStats.totalCustomers} customers
            </p>
          </div>
          <Button onClick={handleAddCustomer} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Customer
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCustomerStats.totalCustomers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <UserPlus className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCustomerStats.newThisMonth}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Returning Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCustomerStats.returningRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <CustomerFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        <div>
          <p className="text-sm text-gm-neutral-600 dark:text-gm-neutral-400">
            {sortedCustomers.length} customer{sortedCustomers.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Customers Table */}
        <CustomersTable 
          customers={paginatedCustomers}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Pagination */}
        {sortedCustomers.length > 0 && (
          <CustomerPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Customers;
