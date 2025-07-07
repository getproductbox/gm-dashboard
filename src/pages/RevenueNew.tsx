import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MonthlyRevenue {
  month: string;
  total_transactions: number;
  total_cents: number;
  total_dollars: number;
}

const RevenueNew = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchMonthlyRevenue();
  }, []);

  const fetchMonthlyRevenue = async () => {
    try {
      setIsLoading(true);
      
      // Use SQL query with direct aggregation by month
      const { data, error } = await supabase.rpc('sql', {
        query: `
          SELECT 
            DATE_TRUNC('month', payment_date) as month,
            COUNT(*) as total_transactions,
            SUM(amount_cents) as total_cents
          FROM revenue_events 
          WHERE status = 'completed'
          GROUP BY DATE_TRUNC('month', payment_date)
          ORDER BY month DESC
        `
      });

      if (error) {
        console.error('Error fetching monthly revenue data:', error);
        
        // Fallback to JavaScript grouping if SQL query fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('revenue_events')
          .select('payment_date, amount_cents')
          .eq('status', 'completed');

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return;
        }

        // Manual grouping as fallback
        const monthlyMap = new Map<string, { transactions: number; cents: number }>();
        
        fallbackData?.forEach(row => {
          const date = new Date(row.payment_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { transactions: 0, cents: 0 });
          }
          
          const monthData = monthlyMap.get(monthKey)!;
          monthData.transactions += 1;
          monthData.cents += row.amount_cents;
        });

        const monthlyArray: MonthlyRevenue[] = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({
            month,
            total_transactions: data.transactions,
            total_cents: data.cents,
            total_dollars: Math.round((data.cents / 100) * 100) / 100
          }))
          .sort((a, b) => b.month.localeCompare(a.month));

        setMonthlyData(monthlyArray);
        setTotalCount(fallbackData?.length || 0);
        return;
      }

      // Transform SQL results to component format
      const monthlyArray: MonthlyRevenue[] = data?.map((row: any) => ({
        month: new Date(row.month).toISOString().split('T')[0], // Format as YYYY-MM-DD
        total_transactions: parseInt(row.total_transactions),
        total_cents: parseInt(row.total_cents),
        total_dollars: Math.round((parseInt(row.total_cents) / 100) * 100) / 100
      })) || [];

      setMonthlyData(monthlyArray);
      
      // Get total count separately
      const totalTransactions = monthlyArray.reduce((sum, month) => sum + month.total_transactions, 0);
      setTotalCount(totalTransactions);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    return format(new Date(monthString), 'MMMM yyyy');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monthly Revenue Summary</h1>
          <p className="text-muted-foreground">Revenue grouped by month ({totalCount} total transactions)</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((monthData) => (
                    <TableRow key={monthData.month}>
                      <TableCell className="font-medium">
                        {formatMonth(monthData.month)}
                      </TableCell>
                      <TableCell className="text-right">
                        {monthData.total_transactions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(monthData.total_dollars)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RevenueNew;