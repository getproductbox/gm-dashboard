import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProfitLossAccount {
  account_id: string;
  account_name: string;
  account_type: string;
  category: string; // Changed from union type to string
  subcategory: string;
  amount_cents: number;
  currency: string;
  period_start: string;
  period_end: string;
  report_date: string;
}

export interface ProfitLossSummary {
  period_start: string;
  period_end: string;
  total_revenue_cents: number;
  cost_of_sales_cents: number;
  gross_profit_cents: number;
  operating_expenses_cents: number;
  net_profit_cents: number;
  gross_margin_percentage: number;
  net_margin_percentage: number;
  accounts: ProfitLossAccount[];
}

export interface ProfitLossComparison {
  current: ProfitLossSummary;
  previous: ProfitLossSummary;
  changes: {
    revenue_change_cents: number;
    revenue_change_percentage: number;
    gross_profit_change_cents: number;
    gross_profit_change_percentage: number;
    net_profit_change_cents: number;
    net_profit_change_percentage: number;
  };
}

export interface RevenueReconciliation {
  period_start: string;
  period_end: string;
  square_revenue_cents: number;
  xero_revenue_cents: number;
  difference_cents: number;
  difference_percentage: number;
  discrepancies: Array<{
    source: 'square' | 'xero';
    category: string;
    amount_cents: number;
    description: string;
  }>;
}

export const useProfitLoss = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profitLossData, setProfitLossData] = useState<ProfitLossSummary | null>(null);
  const [comparisonData, setComparisonData] = useState<ProfitLossComparison | null>(null);
  const [reconciliationData, setReconciliationData] = useState<RevenueReconciliation | null>(null);

  const fetchProfitLossData = useCallback(async (
    startDate: string,
    endDate: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profit_loss_events')
        .select('*')
        .gte('period_start', startDate)
        .lte('period_end', endDate)
        .order('account_name');

      if (error) throw error;

      const summary = calculateProfitLossSummary(data || [], startDate, endDate);
      setProfitLossData(summary);
      
      return summary;
    } catch (error) {
      console.error('Error fetching P&L data:', error);
      toast.error('Failed to fetch profit & loss data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchComparisonData = useCallback(async (
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string
  ) => {
    setIsLoading(true);
    try {
      const [currentData, previousData] = await Promise.all([
        fetchProfitLossData(currentStart, currentEnd),
        fetchProfitLossData(previousStart, previousEnd)
      ]);

      const comparison = calculateComparison(currentData, previousData);
      setComparisonData(comparison);
      
      return comparison;
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('Failed to fetch comparison data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfitLossData]);

  const fetchRevenueReconciliation = useCallback(async (
    startDate: string,
    endDate: string
  ) => {
    setIsLoading(true);
    try {
      // Fetch Square revenue data
      const { data: squareData, error: squareError } = await supabase
        .from('revenue_events')
        .select('amount_cents, revenue_type')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .eq('status', 'completed');

      if (squareError) throw squareError;

      // Fetch Xero revenue data
      const { data: xeroData, error: xeroError } = await supabase
        .from('profit_loss_events')
        .select('amount_cents, subcategory')
        .gte('period_start', startDate)
        .lte('period_end', endDate)
        .eq('category', 'revenue');

      if (xeroError) throw xeroError;

      const reconciliation = calculateRevenueReconciliation(
        squareData || [],
        xeroData || [],
        startDate,
        endDate
      );
      
      setReconciliationData(reconciliation);
      return reconciliation;
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast.error('Failed to fetch revenue reconciliation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    profitLossData,
    comparisonData,
    reconciliationData,
    fetchProfitLossData,
    fetchComparisonData,
    fetchRevenueReconciliation
  };
};

function calculateProfitLossSummary(
  accounts: ProfitLossAccount[],
  periodStart: string,
  periodEnd: string
): ProfitLossSummary {
  const revenueAccounts = accounts.filter(a => a.category === 'revenue');
  const costOfSalesAccounts = accounts.filter(a => a.category === 'cost_of_sales');
  const operatingExpensesAccounts = accounts.filter(a => a.category === 'operating_expenses');

  const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.amount_cents, 0);
  const costOfSales = costOfSalesAccounts.reduce((sum, acc) => sum + acc.amount_cents, 0);
  const operatingExpenses = operatingExpensesAccounts.reduce((sum, acc) => sum + acc.amount_cents, 0);

  const grossProfit = totalRevenue - costOfSales;
  const netProfit = grossProfit - operatingExpenses;

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    period_start: periodStart,
    period_end: periodEnd,
    total_revenue_cents: totalRevenue,
    cost_of_sales_cents: costOfSales,
    gross_profit_cents: grossProfit,
    operating_expenses_cents: operatingExpenses,
    net_profit_cents: netProfit,
    gross_margin_percentage: grossMargin,
    net_margin_percentage: netMargin,
    accounts
  };
}

function calculateComparison(
  current: ProfitLossSummary,
  previous: ProfitLossSummary
): ProfitLossComparison {
  const revenueChange = current.total_revenue_cents - previous.total_revenue_cents;
  const revenueChangePercentage = previous.total_revenue_cents > 0 
    ? (revenueChange / previous.total_revenue_cents) * 100 
    : 0;

  const grossProfitChange = current.gross_profit_cents - previous.gross_profit_cents;
  const grossProfitChangePercentage = previous.gross_profit_cents > 0 
    ? (grossProfitChange / previous.gross_profit_cents) * 100 
    : 0;

  const netProfitChange = current.net_profit_cents - previous.net_profit_cents;
  const netProfitChangePercentage = previous.net_profit_cents > 0 
    ? (netProfitChange / previous.net_profit_cents) * 100 
    : 0;

  return {
    current,
    previous,
    changes: {
      revenue_change_cents: revenueChange,
      revenue_change_percentage: revenueChangePercentage,
      gross_profit_change_cents: grossProfitChange,
      gross_profit_change_percentage: grossProfitChangePercentage,
      net_profit_change_cents: netProfitChange,
      net_profit_change_percentage: netProfitChangePercentage
    }
  };
}

function calculateRevenueReconciliation(
  squareData: Array<{ amount_cents: number; revenue_type: string }>,
  xeroData: Array<{ amount_cents: number; subcategory: string }>,
  periodStart: string,
  periodEnd: string
): RevenueReconciliation {
  const squareRevenue = squareData.reduce((sum, item) => sum + item.amount_cents, 0);
  const xeroRevenue = xeroData.reduce((sum, item) => sum + item.amount_cents, 0);

  const difference = Math.abs(squareRevenue - xeroRevenue);
  const differencePercentage = Math.max(squareRevenue, xeroRevenue) > 0 
    ? (difference / Math.max(squareRevenue, xeroRevenue)) * 100 
    : 0;

  // Group by category for discrepancy analysis
  const squareByType = squareData.reduce((acc, item) => {
    acc[item.revenue_type] = (acc[item.revenue_type] || 0) + item.amount_cents;
    return acc;
  }, {} as Record<string, number>);

  const xeroBySubcategory = xeroData.reduce((acc, item) => {
    acc[item.subcategory] = (acc[item.subcategory] || 0) + item.amount_cents;
    return acc;
  }, {} as Record<string, number>);

  const discrepancies: Array<{
    source: 'square' | 'xero';
    category: string;
    amount_cents: number;
    description: string;
  }> = [];

  // Map Square revenue types to Xero subcategories for comparison
  const revenueMapping = {
    'bar': 'bar_revenue',
    'door': 'door_revenue'
  };

  Object.entries(revenueMapping).forEach(([squareType, xeroSubcat]) => {
    const squareAmount = squareByType[squareType] || 0;
    const xeroAmount = xeroBySubcategory[xeroSubcat] || 0;
    
    if (Math.abs(squareAmount - xeroAmount) > 100) { // Only report differences > $1
      discrepancies.push({
        source: squareAmount > xeroAmount ? 'square' : 'xero',
        category: squareType,
        amount_cents: Math.abs(squareAmount - xeroAmount),
        description: `${squareType} revenue discrepancy: Square $${(squareAmount/100).toFixed(2)} vs Xero $${(xeroAmount/100).toFixed(2)}`
      });
    }
  });

  return {
    period_start: periodStart,
    period_end: periodEnd,
    square_revenue_cents: squareRevenue,
    xero_revenue_cents: xeroRevenue,
    difference_cents: difference,
    difference_percentage: differencePercentage,
    discrepancies
  };
}