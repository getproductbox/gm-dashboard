-- Add JSONB array to track per-ticket check-ins (timestamp or null per ticket)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS ticket_checkins JSONB;

-- No changes needed for updated_at as trigger already exists (handle_bookings_updated_at)


