export const formatCurrency = (amountCents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
};

export const formatPercentage = (percentage: number, decimals = 1): string => {
  return `${percentage.toFixed(decimals)}%`;
};

export const formatChangeIndicator = (
  change: number,
  isPercentage = false,
  showArrow = true
): { value: string; color: string; isPositive: boolean } => {
  const isPositive = change >= 0;
  const arrow = showArrow ? (isPositive ? '↗' : '↘') : '';
  const value = isPercentage 
    ? `${arrow}${formatPercentage(Math.abs(change))}`
    : `${arrow}${formatCurrency(Math.abs(change))}`;
  
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  
  return { value, color, isPositive };
};

export const calculateMargin = (profit: number, revenue: number): number => {
  return revenue > 0 ? (profit / revenue) * 100 : 0;
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
};

export const groupAccountsByCategory = (accounts: Array<{
  category: string;
  subcategory: string;
  account_name: string;
  amount_cents: number;
}>) => {
  return accounts.reduce((groups, account) => {
    const category = account.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(account);
    return groups;
  }, {} as Record<string, typeof accounts>);
};

export const groupAccountsBySubcategory = (accounts: Array<{
  subcategory: string;
  account_name: string;
  amount_cents: number;
}>) => {
  return accounts.reduce((groups, account) => {
    const subcategory = account.subcategory;
    if (!groups[subcategory]) {
      groups[subcategory] = {
        total_cents: 0,
        accounts: []
      };
    }
    groups[subcategory].total_cents += account.amount_cents;
    groups[subcategory].accounts.push(account);
    return groups;
  }, {} as Record<string, { total_cents: number; accounts: typeof accounts }>);
};

export const sortAccountsByAmount = (accounts: Array<{ amount_cents: number; account_name: string }>, descending = true) => {
  return [...accounts].sort((a, b) => 
    descending ? b.amount_cents - a.amount_cents : a.amount_cents - b.amount_cents
  );
};

export const calculatePeriodDates = (period: 'month' | 'quarter' | 'year', offset = 0) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let startDate: Date;
  let endDate: Date;
  
  switch (period) {
    case 'month':
      startDate = new Date(year, month - offset, 1);
      endDate = new Date(year, month - offset + 1, 0);
      break;
    case 'quarter':
      const quarterStart = Math.floor(month / 3) * 3 - (offset * 3);
      startDate = new Date(year, quarterStart, 1);
      endDate = new Date(year, quarterStart + 3, 0);
      break;
    case 'year':
      startDate = new Date(year - offset, 0, 1);
      endDate = new Date(year - offset, 11, 31);
      break;
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label: formatPeriodLabel(startDate, endDate, period)
  };
};

export const formatPeriodLabel = (startDate: Date, endDate: Date, period: 'month' | 'quarter' | 'year'): string => {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  switch (period) {
    case 'month':
      return startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    case 'quarter':
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter} ${startYear}`;
    case 'year':
      return startYear.toString();
    default:
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
};

export const getCategoryDisplayName = (category: string): string => {
  const categoryNames = {
    'revenue': 'Revenue',
    'cost_of_sales': 'Cost of Sales',
    'operating_expenses': 'Operating Expenses',
    'other': 'Other'
  };
  return categoryNames[category as keyof typeof categoryNames] || category;
};

export const getSubcategoryDisplayName = (subcategory: string): string => {
  const subcategoryNames = {
    'bar_revenue': 'Bar Revenue',
    'door_revenue': 'Door Revenue',
    'food_revenue': 'Food Revenue',
    'other_revenue': 'Other Revenue',
    'staff_costs': 'Staff Costs',
    'rent': 'Rent & Lease',
    'marketing': 'Marketing & Advertising',
    'utilities': 'Utilities',
    'other_expenses': 'Other Expenses'
  };
  return subcategoryNames[subcategory as keyof typeof subcategoryNames] || subcategory;
};

export const getProfitLossColors = () => ({
  revenue: 'text-green-600',
  costOfSales: 'text-orange-600',
  grossProfit: 'text-blue-600',
  operatingExpenses: 'text-red-600',
  netProfit: 'text-purple-600',
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600'
});

export const validateProfitLossData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const requiredFields = [
    'total_revenue_cents',
    'cost_of_sales_cents',
    'gross_profit_cents',
    'operating_expenses_cents',
    'net_profit_cents',
    'accounts'
  ];
  
  return requiredFields.every(field => field in data);
};