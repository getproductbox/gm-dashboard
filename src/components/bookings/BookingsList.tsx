import { useState, useMemo } from "react";
import { BookingsFilters } from "./BookingsFilters";
import { BookingsTable } from "./BookingsTable";
import { BookingsPagination } from "./BookingsPagination";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { BookingRow, BookingFilters } from "@/services/bookingService";

export const BookingsList = () => {
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof BookingRow>('booking_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<BookingFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    status: undefined,
    venue: undefined,
    bookingType: undefined,
    search: undefined,
  });

  const { data: bookings = [], isLoading, error } = useBookings(filters);

  const sortedBookings = useMemo(() => {
    if (!bookings.length) return [];

    const sorted = [...bookings].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'customer_name':
          aValue = a.customer_name;
          bValue = b.customer_name;
          break;
        case 'venue':
          aValue = a.venue;
          bValue = b.venue;
          break;
        case 'booking_type':
          aValue = a.booking_type;
          bValue = b.booking_type;
          break;
        case 'booking_date':
          aValue = a.booking_date;
          bValue = b.booking_date;
          break;
        case 'start_time':
          aValue = a.start_time || '';
          bValue = b.start_time || '';
          break;
        case 'guest_count':
          aValue = a.guest_count || 0;
          bValue = b.guest_count || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'total_amount':
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        default:
          aValue = a.booking_date;
          bValue = b.booking_date;
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
  }, [bookings, sortField, sortDirection]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedBookings.slice(startIndex, endIndex);
  }, [sortedBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  const handleFiltersChange = (newFilters: BookingFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof BookingRow) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: undefined,
      dateTo: undefined,
      status: undefined,
      venue: undefined,
      bookingType: undefined,
      search: undefined,
    });
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 text-lg font-medium">Error Loading Bookings</p>
        <p className="text-red-600 text-sm mt-2">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gm-neutral-900">All Bookings</h2>
        <p className="text-sm text-gm-neutral-600">
          {isLoading ? 'Loading...' : `${sortedBookings.length} booking${sortedBookings.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <BookingsFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      <BookingsTable 
        bookings={paginatedBookings}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        isLoading={isLoading}
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
