-- Fix venue_area constraint to allow 'karaoke' value
-- This script adds 'karaoke' to the allowed values for venue_area field

-- First, check the current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'bookings_venue_area_check';

-- Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_venue_area_check;

-- Add the updated constraint that includes 'karaoke'
-- Based on typical venue systems, common values would be:
-- main_hall, private_room, outdoor_area, vip_area, karaoke
ALTER TABLE bookings 
ADD CONSTRAINT bookings_venue_area_check 
CHECK (venue_area IN ('main_hall', 'private_room', 'outdoor_area', 'vip_area', 'karaoke'));

-- Verify the constraint was added correctly
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'bookings_venue_area_check'; 