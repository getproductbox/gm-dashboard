import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

interface RevenueTransaction {
  id: string;
  square_payment_id: string;
  venue: string;
  revenue_type: string;
  amount_cents: number;
  currency: string;
  payment_date: string;
  status: string;
}

interface DailyRevenue {
  date: string;
  total_amount: number;
  transaction_count: number;
  venues: {
    venue: string;
    revenue_type: string;
    amount: number;
    count: number;
  }[];
}

interface MonthlyRevenue {
  month: string;
  total_amount: number;
  transaction_count: number;
  days_with_transactions: number;
}

const RevenueNew = () => {
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RevenueTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchDailyRevenue(),
        fetchMonthlyRevenue(), 
        fetchRecentTransactions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyRevenue = async () => {
    const { data, error } = await supabase
      .from('revenue_events')
      .select('payment_date, venue, revenue_type, amount_cents')
      .eq('status', 'completed')
      .gte('amount_cents', 1); // Filter out zero-value transactions

    if (error) {
      console.error('Error fetching daily revenue:', error);
      return;
    }

    // Group by date
    const grouped = (data || []).reduce((acc: Record<string, any>, transaction) => {
      const date = format(parseISO(transaction.payment_date), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          total_amount: 0,
          transaction_count: 0,
          venues: []
        };
      }

      acc[date].total_amount += transaction.amount_cents;
      acc[date].transaction_count += 1;

      // Group by venue and revenue type
      const venueKey = `${transaction.venue}_${transaction.revenue_type}`;
      const existingVenue = acc[date].venues.find((v: any) => 
        v.venue === transaction.venue && v.revenue_type === transaction.revenue_type
      );

      if (existingVenue) {
        existingVenue.amount += transaction.amount_cents;
        existingVenue.count += 1;
      } else {
        acc[date].venues.push({
          venue: transaction.venue,
          revenue_type: transaction.revenue_type,
          amount: transaction.amount_cents,
          count: 1
        });
      }

      return acc;
    }, {});

    const dailyData = Object.values(grouped)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30); // Show last 30 days with transactions

    setDailyRevenue(dailyData as DailyRevenue[]);
  };

  const fetchMonthlyRevenue = async () => {
    const { data, error } = await supabase
      .from('revenue_events')
      .select('payment_date, amount_cents')
      .eq('status', 'completed')
      .gte('amount_cents', 1);

    if (error) {
      console.error('Error fetching monthly revenue:', error);
      return;
    }

    // Group by month
    const grouped = (data || []).reduce((acc: Record<string, any>, transaction) => {
      const month = format(parseISO(transaction.payment_date), 'yyyy-MM');
      const date = format(parseISO(transaction.payment_date), 'yyyy-MM-dd');
      
      if (!acc[month]) {
        acc[month] = {
          month,
          total_amount: 0,
          transaction_count: 0,
          days_with_transactions: new Set()
        };
      }

      acc[month].total_amount += transaction.amount_cents;
      acc[month].transaction_count += 1;
      acc[month].days_with_transactions.add(date);

      return acc;
    }, {});

    const monthlyData = Object.values(grouped)
      .map((month: any) => ({
        ...month,
        days_with_transactions: month.days_with_transactions.size
      }))
      .sort((a: any, b: any) => b.month.localeCompare(a.month));

    setMonthlyRevenue(monthlyData as MonthlyRevenue[]);
  };

  const fetchRecentTransactions = async () => {
    const { data, error } = await supabase
      .from('revenue_events')
      .select('id, square_payment_id, venue, revenue_type, amount_cents, currency, payment_date, status')
      .eq('status', 'completed')
      .gte('amount_cents', 1)
      .order('payment_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching recent transactions:', error);
      return;
    }

    setRecentTransactions(data || []);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Revenue transactions grouped by date and period</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Summary</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Summary (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead>Breakdown</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyRevenue.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {formatDate(day.date)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(day.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {day.transaction_count}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {day.venues.map((venue, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {venue.venue} ({venue.revenue_type}): {formatCurrency(venue.amount)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Active Days</TableHead>
                      <TableHead className="text-right">Avg per Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRevenue.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {format(parseISO(month.month + '-01'), 'MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(month.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {month.transaction_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {month.days_with_transactions}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Math.round(month.total_amount / month.days_with_transactions))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions (Last 100)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {formatDateTime(transaction.payment_date)}
                        </TableCell>
                        <TableCell>{transaction.venue}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.revenue_type === 'bar' ? 'default' : 'secondary'}>
                            {transaction.revenue_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.amount_cents)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {transaction.square_payment_id.slice(-8)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RevenueNew;