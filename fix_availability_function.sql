-- Fix for ambiguous column reference issue in karaoke booth availability function
-- This should be executed against your Supabase database

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
        SELECT 1 FROM public.bookings b
        WHERE b.karaoke_booth_id = booth_id 
        AND b.booking_date = get_karaoke_booth_availability.booking_date
        AND b.status != 'cancelled'
        AND (exclude_booking_id IS NULL OR b.id != exclude_booking_id)
        AND (
            -- New booking overlaps with existing booking
            (get_karaoke_booth_availability.start_time < b.end_time AND get_karaoke_booth_availability.end_time > b.start_time)
        )
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- If no conflicts, booth is available
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test the function (optional)
-- SELECT public.get_karaoke_booth_availability(
--     '00000000-0000-0000-0000-000000000000'::UUID,
--     '2024-01-01'::DATE,
--     '15:00'::TIME,
--     '16:00'::TIME,
--     NULL
-- ); 