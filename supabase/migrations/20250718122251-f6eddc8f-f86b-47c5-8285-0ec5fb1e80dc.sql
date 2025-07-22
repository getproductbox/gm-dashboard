-- Add Karaoke Booths Support
-- Migration: Create karaoke_booths table and extend bookings for karaoke functionality

-- Create karaoke_booths table for flexible booth management
CREATE TABLE public.karaoke_booths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    venue TEXT NOT NULL CHECK (venue IN ('manor', 'hippie')),
    capacity INTEGER DEFAULT 8,
    hourly_rate DECIMAL(10,2) DEFAULT 25.00,
    is_available BOOLEAN DEFAULT true,
    maintenance_notes TEXT,
    operating_hours_start TIME DEFAULT '10:00',
    operating_hours_end TIME DEFAULT '23:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend bookings table for karaoke
ALTER TABLE public.bookings 
ADD COLUMN karaoke_booth_id UUID REFERENCES public.karaoke_booths(id);

-- Update booking_type constraint to include karaoke
ALTER TABLE public.bookings 
DROP CONSTRAINT bookings_booking_type_check,
ADD CONSTRAINT bookings_booking_type_check 
CHECK (booking_type IN ('venue_hire', 'vip_tickets', 'karaoke_booking'));

-- Performance indexes for karaoke_booths
CREATE INDEX idx_karaoke_booths_venue ON public.karaoke_booths(venue);
CREATE INDEX idx_karaoke_booths_available ON public.karaoke_booths(is_available);
CREATE INDEX idx_bookings_karaoke_booth ON public.bookings(karaoke_booth_id);

-- Enable RLS for karaoke_booths
ALTER TABLE public.karaoke_booths ENABLE ROW LEVEL SECURITY;

-- Policy for karaoke_booths: authenticated users have full access
CREATE POLICY "Authenticated users full access" ON public.karaoke_booths
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger to karaoke_booths table
CREATE TRIGGER handle_karaoke_booths_updated_at
    BEFORE UPDATE ON public.karaoke_booths
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial karaoke booths for both venues
INSERT INTO public.karaoke_booths (name, venue, capacity, hourly_rate, is_available) VALUES
('Karaoke Room A', 'manor', 8, 25.00, true),
('Karaoke Room B', 'manor', 6, 25.00, true),
('Karaoke Room C', 'manor', 10, 30.00, true),
('Karaoke Studio 1', 'hippie', 12, 35.00, true),
('Karaoke Studio 2', 'hippie', 8, 30.00, true);

-- Add validation function for karaoke booking conflicts
CREATE OR REPLACE FUNCTION public.validate_karaoke_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate karaoke bookings
    IF NEW.booking_type = 'karaoke_booking' AND NEW.karaoke_booth_id IS NOT NULL THEN
        -- Check for overlapping bookings on the same booth and date
        IF EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE karaoke_booth_id = NEW.karaoke_booth_id 
            AND booking_date = NEW.booking_date
            AND status != 'cancelled'
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
            AND (
                -- New booking overlaps with existing booking
                (NEW.start_time < end_time AND NEW.end_time > start_time)
            )
        ) THEN
            RAISE EXCEPTION 'Karaoke booth is already booked for this time slot';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger for karaoke bookings
CREATE TRIGGER validate_karaoke_booking_conflict_trigger
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_karaoke_booking_conflict();

-- Create a function to check karaoke booth availability
CREATE OR REPLACE FUNCTION public.get_karaoke_booth_availability(
    booth_id UUID,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if booth exists and is available
    IF NOT EXISTS (
        SELECT 1 FROM public.karaoke_booths 
        WHERE id = booth_id AND is_available = true
    ) THEN
        RETURN false;
    END IF;
    
    -- Check for conflicting bookings
    IF EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.karaoke_booth_id = booth_id
        AND b.booking_date = get_karaoke_booth_availability.booking_date
        AND b.status != 'cancelled'
        AND (exclude_booking_id IS NULL OR b.id != exclude_booking_id)
        AND (get_karaoke_booth_availability.start_time < b.end_time AND get_karaoke_booth_availability.end_time > b.start_time)
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql; 