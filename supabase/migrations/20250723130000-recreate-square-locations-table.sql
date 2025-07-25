-- Recreate square_locations table that was accidentally deleted during refactoring
CREATE TABLE IF NOT EXISTS public.square_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  square_location_id TEXT NOT NULL UNIQUE,
  location_name TEXT NOT NULL,
  address TEXT,
  business_name TEXT,
  country TEXT,
  currency TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  is_active BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.square_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for square_locations
CREATE POLICY "Staff can view all locations" 
ON public.square_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can insert locations" 
ON public.square_locations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can update locations" 
ON public.square_locations 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_square_locations_updated_at
BEFORE UPDATE ON public.square_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default locations based on the venue mapping in the transform function
-- These are placeholder location IDs - you'll need to replace them with actual Square location IDs
-- Run the check-location-ids.html file to find your actual location IDs
INSERT INTO public.square_locations (
  square_location_id, 
  location_name, 
  business_name, 
  environment,
  is_active
) VALUES 
  ('LOCATION_HIPPIE_DOOR', 'Hippie Door', 'Hippie Door', 'production', true),
  ('LOCATION_HIPPIE_BAR', 'Hippie Bar', 'Hippie Bar', 'production', true),
  ('LOCATION_MANOR_BAR', 'Manor Bar', 'Manor Bar', 'production', true)
ON CONFLICT (square_location_id) DO NOTHING;

-- Create a function to dynamically add locations based on actual payment data
CREATE OR REPLACE FUNCTION public.add_missing_locations_from_payments()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  location_record RECORD;
  venue_name TEXT;
  added_count INTEGER := 0;
BEGIN
  -- Find all unique location IDs from payments that don't exist in square_locations
  FOR location_record IN 
    SELECT DISTINCT 
      raw_response->>'location_id' as location_id,
      COUNT(*) as payment_count
    FROM square_payments_raw 
    WHERE raw_response->>'location_id' IS NOT NULL
    AND raw_response->>'location_id' NOT IN (SELECT square_location_id FROM square_locations)
    GROUP BY raw_response->>'location_id'
  LOOP
    -- Try to guess venue name from location ID
    venue_name := CASE 
      WHEN location_record.location_id ILIKE '%hippie%' AND location_record.location_id ILIKE '%door%' THEN 'Hippie Door'
      WHEN location_record.location_id ILIKE '%hippie%' AND location_record.location_id ILIKE '%bar%' THEN 'Hippie Bar'
      WHEN location_record.location_id ILIKE '%manor%' THEN 'Manor Bar'
      WHEN location_record.location_id ILIKE '%bar%' THEN 'Hippie Bar'
      WHEN location_record.location_id ILIKE '%door%' THEN 'Hippie Door'
      ELSE 'Unknown Venue'
    END;
    
    -- Insert the missing location
    INSERT INTO square_locations (
      square_location_id, 
      location_name, 
      business_name, 
      environment,
      is_active
    ) VALUES (
      location_record.location_id,
      venue_name,
      venue_name,
      'production',
      true
    );
    
    added_count := added_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'added_locations', added_count,
    'message', 'Added ' || added_count || ' missing locations from payment data'
  );
END;
$$;

-- Create function to sync locations from Square API (for future use)
CREATE OR REPLACE FUNCTION public.sync_square_locations()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- This function can be called from an edge function to sync locations from Square API
  -- For now, we'll just return the current locations
  SELECT json_build_object(
    'success', true,
    'locations_count', COUNT(*),
    'locations', json_agg(row_to_json(sl.*))
  ) INTO result
  FROM square_locations sl
  WHERE sl.is_active = true;
  
  RETURN result;
END;
$$; 