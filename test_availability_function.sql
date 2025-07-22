-- Test script for the karaoke booth availability function
-- Run this after applying the function fix

-- Test 1: Check if function exists with correct signature
SELECT 
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_karaoke_booth_availability';

-- Test 2: Test function with sample data (this will fail if no booths exist, but shows the function works)
SELECT public.get_karaoke_booth_availability(
    gen_random_uuid(),
    CURRENT_DATE,
    '15:00'::TIME,
    '16:00'::TIME,
    NULL
) AS test_result;

-- Test 3: Check if karaoke_booths table exists
SELECT COUNT(*) as booth_count FROM public.karaoke_booths;

-- Test 4: Check if bookings table has karaoke_booth_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bookings' 
AND column_name = 'karaoke_booth_id'; 