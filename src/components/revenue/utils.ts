export const formatCurrency = (amount: number) => {
  // Convert from GST inclusive to GST exclusive by dividing by 1.1
  const gstExclusiveAmount = amount / 1.1;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(gstExclusiveAmount);
};

export const formatPercent = (value: number | null) => {
  if (value === null) return '—';
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const getPercentColor = (value: number | null) => {
  if (value === null) return 'text-muted-foreground';
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-muted-foreground';
};

export const calculatePercent = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const formatDollars = (cents: number) => cents / 100;