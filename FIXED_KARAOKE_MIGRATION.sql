-- Fixed Karaoke Booking Migration
-- This script handles cases where tables/columns might already exist

-- Create karaoke_booths table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'karaoke_booths') THEN
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
        
        -- Enable RLS for new table
        ALTER TABLE public.karaoke_booths ENABLE ROW LEVEL SECURITY;
        
        -- Add policy for new table
        CREATE POLICY "Authenticated users full access" ON public.karaoke_booths
            FOR ALL USING (auth.uid() IS NOT NULL);
            
        RAISE NOTICE 'Created karaoke_booths table';
    ELSE
        RAISE NOTICE 'karaoke_booths table already exists, skipping creation';
    END IF;
END $$;

-- Add karaoke_booth_id column to bookings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'bookings' 
                   AND column_name = 'karaoke_booth_id') THEN
        ALTER TABLE public.bookings 
        ADD COLUMN karaoke_booth_id UUID REFERENCES public.karaoke_booths(id);
        
        RAISE NOTICE 'Added karaoke_booth_id column to bookings table';
    ELSE
        RAISE NOTICE 'karaoke_booth_id column already exists, skipping addition';
    END IF;
END $$;

-- Update booking_type constraint to include karaoke_booking
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT FROM information_schema.table_constraints 
               WHERE constraint_schema = 'public' 
               AND table_name = 'bookings' 
               AND constraint_name = 'bookings_booking_type_check') THEN
        ALTER TABLE public.bookings 
        DROP CONSTRAINT bookings_booking_type_check;
        
        RAISE NOTICE 'Dropped existing booking_type constraint';
    END IF;
    
    -- Add new constraint with karaoke_booking
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_booking_type_check 
    CHECK (booking_type IN ('venue_hire', 'vip_tickets', 'karaoke_booking'));
    
    RAISE NOTICE 'Added updated booking_type constraint';
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'karaoke_booths' 
                   AND indexname = 'idx_karaoke_booths_venue') THEN
        CREATE INDEX idx_karaoke_booths_venue ON public.karaoke_booths(venue);
        RAISE NOTICE 'Created idx_karaoke_booths_venue index';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'karaoke_booths' 
                   AND indexname = 'idx_karaoke_booths_available') THEN
        CREATE INDEX idx_karaoke_booths_available ON public.karaoke_booths(is_available);
        RAISE NOTICE 'Created idx_karaoke_booths_available index';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes 
                   WHERE schemaname = 'public' 
                   AND tablename = 'bookings' 
                   AND indexname = 'idx_bookings_karaoke_booth') THEN
        CREATE INDEX idx_bookings_karaoke_booth ON public.bookings(karaoke_booth_id);
        RAISE NOTICE 'Created idx_bookings_karaoke_booth index';
    END IF;
END $$;

-- Add updated_at trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers 
                   WHERE trigger_schema = 'public' 
                   AND trigger_name = 'handle_karaoke_booths_updated_at') THEN
        CREATE TRIGGER handle_karaoke_booths_updated_at
            BEFORE UPDATE ON public.karaoke_booths
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
            
        RAISE NOTICE 'Created updated_at trigger for karaoke_booths';
    END IF;
END $$;

-- Insert initial karaoke booths (only if table is empty)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM public.karaoke_booths LIMIT 1) THEN
        INSERT INTO public.karaoke_booths (name, venue, capacity, hourly_rate, is_available) VALUES
        ('Karaoke Room A', 'manor', 8, 25.00, true),
        ('Karaoke Room B', 'manor', 6, 25.00, true),
        ('Karaoke Room C', 'manor', 10, 30.00, true),
        ('Karaoke Studio 1', 'hippie', 12, 35.00, true),
        ('Karaoke Studio 2', 'hippie', 8, 30.00, true);
        
        RAISE NOTICE 'Inserted initial karaoke booths';
    ELSE
        RAISE NOTICE 'Karaoke booths already exist, skipping initial data insertion';
    END IF;
END $$;

-- Create validation function for karaoke booking conflicts
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

-- Create validation trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.triggers 
                   WHERE trigger_schema = 'public' 
                   AND trigger_name = 'validate_karaoke_booking_conflict_trigger') THEN
        CREATE TRIGGER validate_karaoke_booking_conflict_trigger
            BEFORE INSERT OR UPDATE ON public.bookings
            FOR EACH ROW
            EXECUTE FUNCTION public.validate_karaoke_booking_conflict();
            
        RAISE NOTICE 'Created booking conflict validation trigger';
    END IF;
END $$;

-- Create availability check function
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

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Karaoke booking migration completed successfully!';
END $$; 