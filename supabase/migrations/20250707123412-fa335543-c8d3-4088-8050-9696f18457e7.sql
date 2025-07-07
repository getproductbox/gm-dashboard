-- Update function to include revenue_type breakdown
CREATE OR REPLACE FUNCTION public.get_monthly_revenue_summary()
RETURNS TABLE(
  month TIMESTAMP WITH TIME ZONE,
  revenue_type TEXT,
  total_transactions BIGINT,
  total_cents BIGINT
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', payment_date) as month,
    re.revenue_type,
    COUNT(*) as total_transactions,
    SUM(amount_cents) as total_cents
  FROM revenue_events re
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', payment_date), re.revenue_type
  ORDER BY month DESC, re.revenue_type;
END;
$function$