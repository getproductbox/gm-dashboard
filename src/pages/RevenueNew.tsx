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
  door_transactions: number;
  bar_transactions: number;
  door_revenue_dollars: number;
  bar_revenue_dollars: number;
  total_revenue_dollars: number;
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
      
      // Use database function for direct monthly aggregation
      const { data, error } = await supabase.rpc('get_monthly_revenue_summary');

      if (error) {
        console.error('Error fetching monthly revenue data:', error);
        return;
      }

      // Transform database results to component format
      const monthlyArray: MonthlyRevenue[] = data?.map((row: any) => ({
        month: new Date(row.month).toISOString().split('T')[0],
        total_transactions: Number(row.total_transactions),
        door_transactions: Number(row.door_transactions),
        bar_transactions: Number(row.bar_transactions),
        door_revenue_dollars: Math.round((Number(row.door_revenue_cents) / 100) * 100) / 100,
        bar_revenue_dollars: Math.round((Number(row.bar_revenue_cents) / 100) * 100) / 100,
        total_revenue_dollars: Math.round((Number(row.total_revenue_cents) / 100) * 100) / 100
      })) || [];

      setMonthlyData(monthlyArray);
      
      // Calculate total transactions
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
                    <TableHead className="text-right">Door Revenue</TableHead>
                    <TableHead className="text-right">Bar Revenue</TableHead>
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
                      <TableCell className="text-right">
                        {formatCurrency(monthData.door_revenue_dollars)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(monthData.bar_revenue_dollars)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(monthData.total_revenue_dollars)}
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