-- Add sample bookings for testing the timeslots API
-- This will help the API properly check for booking conflicts

-- Sample venue hire bookings
INSERT INTO public.bookings (
    customer_name,
    customer_email,
    booking_type,
    venue,
    venue_area,
    booking_date,
    start_time,
    end_time,
    duration_hours,
    guest_count,
    status,
    total_amount
) VALUES 
-- Manor Upstairs bookings
('John Smith', 'john@example.com', 'venue_hire', 'manor', 'upstairs', '2025-08-01', '14:00', '16:00', 2, 25, 'confirmed', 600.00),
('Sarah Johnson', 'sarah@example.com', 'venue_hire', 'manor', 'upstairs', '2025-08-01', '18:00', '22:00', 4, 40, 'confirmed', 900.00),

-- Manor Downstairs bookings
('Mike Wilson', 'mike@example.com', 'venue_hire', 'manor', 'downstairs', '2025-08-01', '15:00', '17:00', 2, 60, 'confirmed', 1100.00),

-- Hippie Door bookings
('Lisa Brown', 'lisa@example.com', 'venue_hire', 'hippie', 'main_area', '2025-08-01', '19:00', '23:00', 4, 30, 'confirmed', 400.00),

-- Future bookings for testing
('David Lee', 'david@example.com', 'venue_hire', 'manor', 'upstairs', '2025-08-02', '12:00', '14:00', 2, 20, 'confirmed', 500.00),
('Emma Davis', 'emma@example.com', 'venue_hire', 'manor', 'downstairs', '2025-08-02', '16:00', '20:00', 4, 70, 'confirmed', 1300.00),

-- Karaoke bookings
('Tom Wilson', 'tom@example.com', 'karaoke_booking', 'manor', NULL, '2025-08-01', '20:00', '22:00', 2, 6, 'confirmed', 50.00),
('Amy Chen', 'amy@example.com', 'karaoke_booking', 'hippie', NULL, '2025-08-01', '21:00', '23:00', 2, 8, 'confirmed', 70.00);

-- Update karaoke bookings to reference actual booth IDs
UPDATE public.bookings 
SET karaoke_booth_id = (SELECT id FROM public.karaoke_booths WHERE name = 'Karaoke Room A' LIMIT 1)
WHERE customer_name = 'Tom Wilson';

UPDATE public.bookings 
SET karaoke_booth_id = (SELECT id FROM public.karaoke_booths WHERE name = 'Karaoke Studio 1' LIMIT 1)
WHERE customer_name = 'Amy Chen'; 