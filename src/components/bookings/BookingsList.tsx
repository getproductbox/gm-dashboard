import { useState, useMemo } from "react";
import { BookingsFilters } from "./BookingsFilters";
import { BookingsTable } from "./BookingsTable";
import { BookingsPagination } from "./BookingsPagination";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, X, Download } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { BookingRow, BookingFilters } from "@/services/bookingService";

interface BookingsListProps {
  initialFilters?: Partial<BookingFilters>;
  title?: string;
  hideFilters?: boolean;
}

export const BookingsList = ({ 
  initialFilters = {}, 
  title = "All Bookings",
  hideFilters = false 
}: BookingsListProps) => {
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof BookingRow>('booking_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    status: undefined,
    venue: undefined,
    bookingType: undefined,
    search: undefined,
    ...initialFilters,
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

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== undefined && value !== '');
  };

  const exportToCSV = () => {
    if (!sortedBookings.length) {
      return;
    }

    // Define CSV headers
    const headers = [
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Venue',
      'Venue Area',
      'Booking Type',
      'Booking Date',
      'Start Time',
      'End Time',
      'Guest Count',
      'Ticket Quantity',
      'Status',
      'Total Amount',
      'Special Requests',
      'Staff Notes',
      'Created At'
    ];

    // Convert bookings to CSV rows
    const csvRows = sortedBookings.map(booking => [
      booking.customer_name || '',
      booking.customer_email || '',
      booking.customer_phone || '',
      booking.venue === 'manor' ? 'Manor' : 'Hippie Club',
      booking.venue_area ? booking.venue_area.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '',
      booking.booking_type === 'venue_hire' ? 'Venue Hire' : 'VIP Tickets',
      booking.booking_date || '',
      booking.start_time || '',
      booking.end_time || '',
      booking.guest_count?.toString() || '',
      booking.ticket_quantity?.toString() || '',
      booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
      booking.total_amount ? `$${booking.total_amount.toFixed(2)}` : '',
      booking.special_requests || '',
      booking.staff_notes || '',
      booking.created_at ? new Date(booking.created_at).toLocaleDateString() : ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gm-neutral-900">{title}</h2>
          <p className="text-sm text-gm-neutral-600">
            {isLoading ? 'Loading...' : `${sortedBookings.length} booking${sortedBookings.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={!sortedBookings.length || isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          
          {!hideFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFilters}
              className={`flex items-center gap-2 ${hasActiveFilters() ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
            >
              {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              {showFilters ? 'Hide Filters' : 'Filters'}
              {hasActiveFilters() && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                  {Object.values(filters).filter(value => value !== undefined && value !== '').length}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {!hideFilters && showFilters && (
        <BookingsFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

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
