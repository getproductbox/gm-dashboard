import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { useProfitLoss } from '@/hooks/useProfitLoss';
import { calculatePeriodDates } from '@/utils/profitLossUtils';
import { ProfitLossFilters } from './ProfitLossFilters';
import { ProfitLossTable } from './ProfitLossTable';
import { ExpenseBreakdown } from './ExpenseBreakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const ProfitLossDashboard = () => {
  const {
    isLoading,
    profitLossData,
    comparisonData,
    reconciliationData,
    fetchProfitLossData,
    fetchComparisonData,
    fetchRevenueReconciliation
  } = useProfitLoss();

  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const { startDate, endDate } = calculatePeriodDates('month');
    return { startDate, endDate, type: 'month' };
  });
  const [showComparison, setShowComparison] = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);

  // Load initial data
  useEffect(() => {
    handleDataRefresh();
  }, []);

  const handleDataRefresh = async () => {
    try {
      await fetchProfitLossData(currentPeriod.startDate, currentPeriod.endDate);
      
      if (showComparison) {
        const { startDate: prevStart, endDate: prevEnd } = calculatePeriodDates(
          currentPeriod.type as 'month' | 'quarter' | 'year', 
          1
        );
        await fetchComparisonData(
          currentPeriod.startDate, 
          currentPeriod.endDate,
          prevStart,
          prevEnd
        );
      }

      if (showReconciliation) {
        await fetchRevenueReconciliation(currentPeriod.startDate, currentPeriod.endDate);
      }
    } catch (error) {
      console.error('Error refreshing P&L data:', error);
    }
  };

  const handlePeriodChange = async (startDate: string, endDate: string, periodType: string) => {
    setCurrentPeriod({ startDate, endDate, type: periodType });
    
    try {
      await fetchProfitLossData(startDate, endDate);
      
      if (showComparison && periodType !== 'custom') {
        const { startDate: prevStart, endDate: prevEnd } = calculatePeriodDates(
          periodType as 'month' | 'quarter' | 'year', 
          1
        );
        await fetchComparisonData(startDate, endDate, prevStart, prevEnd);
      }

      if (showReconciliation) {
        await fetchRevenueReconciliation(startDate, endDate);
      }
    } catch (error) {
      console.error('Error updating period:', error);
    }
  };

  const handleComparisonToggle = async (enabled: boolean) => {
    setShowComparison(enabled);
    
    if (enabled && currentPeriod.type !== 'custom') {
      try {
        const { startDate: prevStart, endDate: prevEnd } = calculatePeriodDates(
          currentPeriod.type as 'month' | 'quarter' | 'year', 
          1
        );
        await fetchComparisonData(
          currentPeriod.startDate, 
          currentPeriod.endDate,
          prevStart,
          prevEnd
        );
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      }
    }
  };

  const handleReconciliationToggle = async () => {
    const newState = !showReconciliation;
    setShowReconciliation(newState);
    
    if (newState) {
      try {
        await fetchRevenueReconciliation(currentPeriod.startDate, currentPeriod.endDate);
        toast.success('Revenue reconciliation loaded');
      } catch (error) {
        console.error('Error fetching reconciliation:', error);
        setShowReconciliation(false);
      }
    }
  };

  const exportData = () => {
    if (!profitLossData) return;
    
    // Create CSV data
    const csvData = [
      ['Account', 'Category', 'Subcategory', 'Amount'],
      ...profitLossData.accounts.map(account => [
        account.account_name,
        account.category,
        account.subcategory,
        (account.amount_cents / 100).toFixed(2)
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${currentPeriod.startDate}-to-${currentPeriod.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('P&L data exported to CSV');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gm-neutral-900">Profit & Loss Dashboard</h1>
          <p className="text-gm-neutral-600">
            Comprehensive P&L analysis with expense breakdown and revenue reconciliation
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleReconciliationToggle}
            disabled={isLoading}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {showReconciliation ? 'Hide' : 'Show'} Reconciliation
          </Button>
          
          <Button
            variant="outline"
            onClick={exportData}
            disabled={isLoading || !profitLossData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button
            onClick={handleDataRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProfitLossFilters
        onPeriodChange={handlePeriodChange}
        onComparisonToggle={handleComparisonToggle}
        isLoading={isLoading}
        showComparison={showComparison}
      />

      {/* Revenue Reconciliation */}
      {showReconciliation && reconciliationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Revenue Reconciliation (Square vs Xero)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${(reconciliationData.square_revenue_cents / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gm-neutral-600">Square Revenue</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${(reconciliationData.xero_revenue_cents / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gm-neutral-600">Xero Revenue</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${reconciliationData.difference_percentage < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                  ${(reconciliationData.difference_cents / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gm-neutral-600">
                  Difference ({reconciliationData.difference_percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
            
            {reconciliationData.discrepancies.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Discrepancies Found:</h4>
                <div className="space-y-1">
                  {reconciliationData.discrepancies.map((discrepancy, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{discrepancy.description}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {profitLossData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* P&L Table - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <ProfitLossTable
              data={profitLossData}
              comparisonData={comparisonData}
              showComparison={showComparison}
            />
          </div>
          
          {/* Filters - Takes up 1 column */}
          <div>
            <ProfitLossFilters
              onPeriodChange={handlePeriodChange}
              onComparisonToggle={handleComparisonToggle}
              isLoading={isLoading}
              showComparison={showComparison}
            />
          </div>
        </div>
      ) : !isLoading ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No profit & loss data available for the selected period. 
            Make sure your Xero sync has been completed and try refreshing.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Expense Breakdown */}
      {profitLossData && (
        <ExpenseBreakdown data={profitLossData} />
      )}

      {/* Loading State */}
      {isLoading && !profitLossData && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gm-neutral-400" />
          <span className="ml-2 text-gm-neutral-600">Loading profit & loss data...</span>
        </div>
      )}
    </div>
  );
};