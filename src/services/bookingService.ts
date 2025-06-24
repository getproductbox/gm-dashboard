
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export interface CreateBookingData {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingType: 'venue_hire' | 'vip_tickets';
  venue: 'manor' | 'hippie';
  venueArea?: 'upstairs' | 'downstairs' | 'full_venue';
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  guestCount?: number;
  ticketQuantity?: number;
  specialRequests?: string;
  totalAmount?: number;
  costPerTicket?: number;
  staffNotes?: string;
}

export interface BookingFilters {
  venue?: string;
  bookingType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const bookingService = {
  // Create VIP ticket bookings (multiple entries)
  async createVipTicketBookings(data: CreateBookingData): Promise<BookingRow[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!data.ticketQuantity || !data.costPerTicket) {
      throw new Error('Ticket quantity and cost per ticket are required for VIP bookings');
    }

    // Create array of booking objects (one per ticket)
    const bookingEntries: BookingInsert[] = [];
    for (let i = 0; i < data.ticketQuantity; i++) {
      bookingEntries.push({
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        booking_type: data.bookingType,
        venue: data.venue,
        booking_date: data.bookingDate,
        ticket_quantity: 1, // Each entry represents one ticket
        total_amount: data.costPerTicket,
        special_requests: data.specialRequests,
        staff_notes: data.staffNotes,
        created_by: user.id,
      });
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .insert(bookingEntries)
      .select();

    if (error) {
      console.error('Error creating VIP ticket bookings:', error);
      throw new Error(`Failed to create VIP ticket bookings: ${error.message}`);
    }

    return bookings;
  },

  // Create a new booking (handles both venue hire and VIP tickets)
  async createBooking(data: CreateBookingData): Promise<BookingRow | BookingRow[]> {
    // For VIP tickets, use the bulk creation method
    if (data.bookingType === 'vip_tickets') {
      return this.createVipTicketBookings(data);
    }

    // For venue hire, create single booking as before
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const bookingData: BookingInsert = {
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      booking_type: data.bookingType,
      venue: data.venue,
      venue_area: data.venueArea,
      booking_date: data.bookingDate,
      start_time: data.startTime,
      end_time: data.endTime,
      duration_hours: data.durationHours,
      guest_count: data.guestCount,
      special_requests: data.specialRequests,
      total_amount: data.totalAmount,
      staff_notes: data.staffNotes,
      created_by: user.id,
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    return booking;
  },

  // Get all bookings with optional filters
  async getBookings(filters?: BookingFilters): Promise<BookingRow[]> {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: true });

    // Apply filters
    if (filters?.venue && filters.venue !== 'all') {
      query = query.eq('venue', filters.venue);
    }

    if (filters?.bookingType && filters.bookingType !== 'all') {
      query = query.eq('booking_type', filters.bookingType);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte('booking_date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('booking_date', filters.dateTo);
    }

    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return bookings || [];
  },

  async getBooking(id: string): Promise<BookingRow> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    return booking;
  },

  async updateBooking(id: string, updates: Partial<CreateBookingData>): Promise<BookingRow> {
    const updateData: BookingUpdate = {
      customer_name: updates.customerName,
      customer_email: updates.customerEmail,
      customer_phone: updates.customerPhone,
      booking_type: updates.bookingType,
      venue: updates.venue,
      venue_area: updates.venueArea,
      booking_date: updates.bookingDate,
      start_time: updates.startTime,
      end_time: updates.endTime,
      duration_hours: updates.durationHours,
      guest_count: updates.guestCount,
      ticket_quantity: updates.ticketQuantity,
      special_requests: updates.specialRequests,
      total_amount: updates.totalAmount,
      staff_notes: updates.staffNotes,
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    return booking;
  },

  async updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): Promise<BookingRow> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      throw new Error(`Failed to update booking status: ${error.message}`);
    }

    return booking;
  },

  async getVipTicketsForExport(): Promise<BookingRow[]> {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_type', 'vip_tickets')
      .eq('exported_to_megatix', false)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching VIP tickets for export:', error);
      throw new Error(`Failed to fetch VIP tickets for export: ${error.message}`);
    }

    return bookings || [];
  },

  async markVipTicketsAsExported(bookingIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        exported_to_megatix: true, 
        export_date: new Date().toISOString() 
      })
      .in('id', bookingIds);

    if (error) {
      console.error('Error marking VIP tickets as exported:', error);
      throw new Error(`Failed to mark VIP tickets as exported: ${error.message}`);
    }
  }
};
