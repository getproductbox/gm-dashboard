-- Update the karaoke booth availability function to handle excluding a specific booking
CREATE OR REPLACE FUNCTION public.get_karaoke_booth_availability(
    booth_id UUID,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the booth exists and is available
    IF NOT EXISTS (
        SELECT 1 FROM public.karaoke_booths 
        WHERE id = booth_id AND is_available = true
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for conflicting bookings (exclude specific booking if provided)
    IF EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE karaoke_booth_id = booth_id 
        AND booking_date = get_karaoke_booth_availability.booking_date
        AND status != 'cancelled'
        AND (exclude_booking_id IS NULL OR id != exclude_booking_id)
        AND (
            -- New booking overlaps with existing booking
            (get_karaoke_booth_availability.start_time < end_time AND get_karaoke_booth_availability.end_time > start_time)
        )
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- If no conflicts, booth is available
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 