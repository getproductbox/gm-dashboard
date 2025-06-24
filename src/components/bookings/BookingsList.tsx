
import { useState, useMemo } from "react";
import { BookingsFilters } from "./BookingsFilters";
import { BookingsTable } from "./BookingsTable";
import { BookingsPagination } from "./BookingsPagination";
import { mockExtendedBookings, type ExtendedBooking } from "@/data/mockData/bookings";

export interface BookingFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  service: string;
  search: string;
}

export const BookingsList = () => {
  const [filters, setFilters] = useState<BookingFilters>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    status: 'all',
    service: 'all',
    search: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof ExtendedBooking>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredBookings = useMemo(() => {
    let result = [...mockExtendedBookings];

    // Filter by date range
    if (filters.dateFrom) {
      result = result.filter(booking => booking.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(booking => booking.date <= filters.dateTo);
    }

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(booking => booking.status === filters.status);
    }

    // Filter by service
    if (filters.service !== 'all') {
      result = result.filter(booking => booking.service.toLowerCase().replace(' ', '') === filters.service);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(booking => 
        booking.customer.name.toLowerCase().includes(searchLower) ||
        booking.reference.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'customer') {
        aValue = a.customer.name;
        bValue = b.customer.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [filters, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof ExtendedBooking) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      status: 'all',
      service: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <BookingsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />
      
      <BookingsTable
        bookings={paginatedBookings}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
      
      <BookingsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredBookings.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};
