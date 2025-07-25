-- Fix RLS policy for revenue_events to allow service role inserts
-- This is needed for the transform functions to work properly

-- Create policy for service role to insert revenue events
CREATE POLICY "Service role can insert revenue events" 
ON revenue_events 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Create policy for service role to update revenue events
CREATE POLICY "Service role can update revenue events" 
ON revenue_events 
FOR UPDATE 
TO service_role
USING (true);

-- Create policy for service role to select revenue events
CREATE POLICY "Service role can view revenue events" 
ON revenue_events 
FOR SELECT 
TO service_role
USING (true); 