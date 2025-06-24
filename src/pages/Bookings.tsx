
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookingsFilters } from "@/components/bookings/BookingsFilters";
import { BookingsTable } from "@/components/bookings/BookingsTable";
import { BookingsList } from "@/components/bookings/BookingsList";
import { BookingsPagination } from "@/components/bookings/BookingsPagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { mockBookings, mockBookingStats, Booking } from "@/data/mockData/bookings";

const Bookings = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [sortField, setSortField] = useState<keyof Booking>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    service: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredBookings = useMemo(() => {
    return mockBookings.filter(booking => {
      const matchesSearch = !filters.search || 
        booking.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.service.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || booking.status === filters.status;
      const matchesService = filters.service === 'all' || booking.service === filters.service;
      
      const matchesDateFrom = !filters.dateFrom || booking.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || booking.date <= filters.dateTo;

      return matchesSearch && matchesStatus && matchesService && matchesDateFrom && matchesDateTo;
    });
  }, [filters]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date + ' ' + a.time);
          bValue = new Date(b.date + ' ' + b.time);
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'service':
          aValue = a.service;
          bValue = b.service;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
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
  }, [filteredBookings, sortField, sortDirection]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedBookings.slice(startIndex, endIndex);
  }, [sortedBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Booking) => {
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
      service: 'all',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(1);
  };

  const handleCreateBooking = () => {
    console.log('Create new booking clicked');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gm-neutral-900">Bookings</h1>
            <p className="text-gm-neutral-600">
              {mockBookingStats.totalBookings} bookings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none"
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                List
              </Button>
            </div>
            <Button onClick={handleCreateBooking} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockBookingStats.totalBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockBookingStats.todayBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockBookingStats.completedBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-gm-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockBookingStats.pendingBookings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <BookingsFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        <div>
          <p className="text-sm text-gm-neutral-600">
            {sortedBookings.length} booking{sortedBookings.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Bookings Content - Wrapped in relative container */}
        <div className="relative">
          {viewMode === 'table' ? (
            <BookingsTable 
              bookings={paginatedBookings}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          ) : (
            <BookingsList bookings={paginatedBookings} />
          )}
        </div>

        {/* Pagination */}
        {sortedBookings.length > 0 && (
          <BookingsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedBookings.length}
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

export default Bookings;
