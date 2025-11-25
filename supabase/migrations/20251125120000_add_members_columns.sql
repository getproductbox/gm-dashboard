-- Add is_member and notes columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure RLS policies allow authenticated users (staff) to manage customers
-- This assumes the existing policy "Authenticated users full access" covers this
-- If not, we might need:
-- DROP POLICY IF EXISTS "Authenticated users full access" ON public.customers;
-- CREATE POLICY "Authenticated users full access" ON public.customers
--     FOR ALL USING (auth.uid() IS NOT NULL);

