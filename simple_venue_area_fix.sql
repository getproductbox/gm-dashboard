-- Simple fix for venue_area constraint to allow 'karaoke'
-- This adds 'karaoke' to the existing constraint values

-- Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT bookings_venue_area_check;

-- Add the updated constraint with 'karaoke' included
ALTER TABLE bookings 
ADD CONSTRAINT bookings_venue_area_check 
CHECK (venue_area IN ('upstairs', 'downstairs', 'full_venue', 'karaoke'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'bookings_venue_area_check'; 