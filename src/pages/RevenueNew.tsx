import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MonthlyRevenue {
  month: string;
  transaction_count: number;
  total_amount_cents: number;
  venues: { venue: string; revenue_type: string; count: number; amount_cents: number }[];
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
      
      // Get total count first
      const { count } = await supabase
        .from('revenue_events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      setTotalCount(count || 0);

      // Fetch monthly grouped data manually
      const fallbackData = await fetchMonthlyFallback();
      setMonthlyData(fallbackData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyFallback = async () => {
    const { data, error } = await supabase
      .from('revenue_events')
      .select('venue, revenue_type, amount_cents, payment_date')
      .eq('status', 'completed')
      .order('payment_date', { ascending: false });

    if (error) return [];

    // Group by month manually
    const monthlyMap = new Map<string, {
      transaction_count: number;
      total_amount_cents: number;
      venues: Map<string, { count: number; amount_cents: number }>;
    }>();

    data?.forEach(transaction => {
      const month = format(new Date(transaction.payment_date), 'yyyy-MM');
      const venueKey = `${transaction.venue}-${transaction.revenue_type}`;
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          transaction_count: 0,
          total_amount_cents: 0,
          venues: new Map()
        });
      }
      
      const monthData = monthlyMap.get(month)!;
      monthData.transaction_count += 1;
      monthData.total_amount_cents += transaction.amount_cents;
      
      if (!monthData.venues.has(venueKey)) {
        monthData.venues.set(venueKey, { count: 0, amount_cents: 0 });
      }
      
      const venueData = monthData.venues.get(venueKey)!;
      venueData.count += 1;
      venueData.amount_cents += transaction.amount_cents;
    });

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      transaction_count: data.transaction_count,
      total_amount_cents: data.total_amount_cents,
      venues: Array.from(data.venues.entries()).map(([key, venue]) => {
        const [venueName, revenueType] = key.split('-');
        return {
          venue: venueName,
          revenue_type: revenueType,
          count: venue.count,
          amount_cents: venue.amount_cents
        };
      })
    })).sort((a, b) => b.month.localeCompare(a.month));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatMonth = (monthString: string) => {
    return format(new Date(`${monthString}-01`), 'MMMM yyyy');
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
                    <TableHead>Venue Breakdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((monthData) => (
                    <TableRow key={monthData.month}>
                      <TableCell className="font-medium">
                        {formatMonth(monthData.month)}
                      </TableCell>
                      <TableCell className="text-right">
                        {monthData.transaction_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(monthData.total_amount_cents)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {monthData.venues.map((venue, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                venue.revenue_type === 'bar' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {venue.venue} ({venue.revenue_type})
                              </span>
                              <span className="text-muted-foreground">
                                {venue.count} txns • {formatCurrency(venue.amount_cents)}
                              </span>
                            </div>
                          ))}
                        </div>
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