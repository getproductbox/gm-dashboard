-- Create function to transform ALL transactions within a date range for backfill
CREATE OR REPLACE FUNCTION public.transform_backfill_transactions(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  processed_count INTEGER := 0;
  total_count INTEGER := 0;
  sample_results JSON;
  actual_start_date DATE;
  actual_end_date DATE;
BEGIN
  -- Set default date range if not provided
  actual_start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '2 years');
  actual_end_date := COALESCE(end_date, CURRENT_DATE);
  
  -- Count total transactions within the date range
  SELECT COUNT(*) INTO total_count
  FROM square_payments_raw spr
  WHERE (spr.raw_response->>'created_at')::DATE >= actual_start_date
    AND (spr.raw_response->>'created_at')::DATE <= actual_end_date;
  
  -- Transform transactions within the date range
  WITH backfill_payments AS (
    SELECT 
      spr.square_payment_id,
      spr.raw_response,
      -- Map venue from location_id using square_locations table
      COALESCE(sl.location_name, 'default') as venue_name,
      -- Extract payment details
      (spr.raw_response->>'created_at')::TIMESTAMP WITH TIME ZONE as payment_timestamp,
      (spr.raw_response->'amount_money'->>'amount')::INTEGER as amount_cents,
      COALESCE(spr.raw_response->'amount_money'->>'currency', 'USD') as currency
    FROM square_payments_raw spr
    LEFT JOIN square_locations sl ON sl.square_location_id = spr.raw_response->>'location_id'
    WHERE 
      (spr.raw_response->>'created_at')::DATE >= actual_start_date
      AND (spr.raw_response->>'created_at')::DATE <= actual_end_date
      AND COALESCE(spr.raw_response->>'status', 'COMPLETED') = 'COMPLETED'
    ORDER BY spr.raw_response->>'created_at' DESC
  )
  INSERT INTO revenue_events (
    square_payment_id,
    venue,
    revenue_type,
    amount_cents,
    currency,
    payment_date,
    payment_hour,
    payment_day_of_week,
    status,
    processed_at
  )
  SELECT 
    bp.square_payment_id,
    bp.venue_name,
    -- Use venue-based revenue type mapping
    CASE bp.venue_name
      WHEN 'Hippie Door' THEN 'door'
      WHEN 'Hippie Bar' THEN 'bar'
      WHEN 'Manor Bar' THEN 'bar'
      ELSE 'bar'  -- Default fallback
    END as revenue_type,
    bp.amount_cents,
    bp.currency,
    bp.payment_timestamp,
    EXTRACT(HOUR FROM bp.payment_timestamp)::INTEGER,
    EXTRACT(DOW FROM bp.payment_timestamp)::INTEGER,
    'completed',
    NOW()
  FROM backfill_payments bp
  ON CONFLICT (square_payment_id) 
  DO UPDATE SET
    venue = EXCLUDED.venue,
    revenue_type = EXCLUDED.revenue_type,
    amount_cents = EXCLUDED.amount_cents,
    payment_date = EXCLUDED.payment_date,
    payment_hour = EXCLUDED.payment_hour,
    payment_day_of_week = EXCLUDED.payment_day_of_week,
    updated_at = NOW();
  
  -- Get count of processed records
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  -- Get sample results for verification
  SELECT json_agg(row_to_json(re.*)) INTO sample_results
  FROM (
    SELECT square_payment_id, venue, revenue_type, amount_cents, payment_date
    FROM revenue_events 
    WHERE payment_date >= actual_start_date AND payment_date <= actual_end_date
    ORDER BY processed_at DESC 
    LIMIT 5
  ) re;
  
  -- Return results
  RETURN json_build_object(
    'success', true,
    'processed_count', processed_count,
    'total_in_range', total_count,
    'start_date', actual_start_date,
    'end_date', actual_end_date,
    'sample_results', sample_results,
    'message', 'Successfully transformed ' || processed_count || ' transactions from ' || actual_start_date || ' to ' || actual_end_date
  );
END;
$function$; 