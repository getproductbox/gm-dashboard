import { useState, useMemo } from "react";
import { BookingsFilters } from "./BookingsFilters";
import { BookingsTable } from "./BookingsTable";
import { BookingsPagination } from "./BookingsPagination";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { mockBookings } from "@/data/mockData/bookings";

export interface BookingFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  service: string;
  search: string;
}

export const BookingsList = () => {
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<BookingFilters>({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    service: 'all',
    search: '',
  });

  const filteredBookings = useMemo(() => {
    return mockBookings.filter(booking => {
      const matchesDateFrom = !filters.dateFrom || booking.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || booking.date <= filters.dateTo;
      const matchesStatus = filters.status === 'all' || booking.status === filters.status;
      const matchesService = filters.service === 'all' || booking.service.toLowerCase().includes(filters.service.toLowerCase());
      const matchesSearch = !filters.search || 
        booking.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.reference.toLowerCase().includes(filters.search.toLowerCase());

      return matchesDateFrom && matchesDateTo && matchesStatus && matchesService && matchesSearch;
    });
  }, [filters]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'reference':
          aValue = a.reference;
          bValue = b.reference;
          break;
        case 'customer':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'service':
          aValue = a.service;
          bValue = b.service;
          break;
        case 'date':
          aValue = a.date;
          bValue = b.date;
          break;
        case 'time':
          aValue = a.time;
          bValue = b.time;
          break;
        case 'guests':
          aValue = a.guests;
          bValue = b.guests;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    return sorted;
  }, [filteredBookings, sortBy, sortOrder]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedBookings.slice(startIndex, endIndex);
  }, [sortedBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  const handleFilterChange = (newFilters: Partial<BookingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      service: 'all',
      search: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gm-neutral-900">All Bookings</h2>
          <p className="text-sm text-gm-neutral-600">
            {sortedBookings.length} booking{sortedBookings.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={() => navigate('/bookings/create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Booking
        </Button>
      </div>

      <BookingsFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <BookingsTable 
        bookings={paginatedBookings}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

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
  );
};
