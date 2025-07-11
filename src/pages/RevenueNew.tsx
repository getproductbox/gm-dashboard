import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueStackedChart } from '@/components/revenue/RevenueStackedChart';
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

interface WeeklyRevenue {
  week_start: string;
  total_transactions: number;
  door_transactions: number;
  bar_transactions: number;
  door_revenue_dollars: number;
  bar_revenue_dollars: number;
  total_revenue_dollars: number;
}

const RevenueNew = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [venues, setVenues] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('monthly');

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyRevenue();
    } else {
      fetchWeeklyRevenue();
    }
  }, [selectedVenue, activeTab]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('venue')
        .eq('status', 'completed');

      console.log('Venues query result:', { data, error });

      if (error) {
        console.error('Error fetching venues:', error);
        return;
      }

      // Get unique venues from the data
      const uniqueVenues = [...new Set(data?.map(row => row.venue))].sort() || [];
      console.log('Unique venues found:', uniqueVenues);
      setVenues(uniqueVenues);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      setIsLoading(true);
      
      // Use database function with venue filter parameter
      const venueFilter = selectedVenue === 'all' ? null : selectedVenue;
      const { data, error } = await supabase.rpc('get_monthly_revenue_summary', {
        venue_filter: venueFilter,
        month_date: null
      });

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

  const fetchWeeklyRevenue = async () => {
    try {
      setIsLoading(true);
      
      // Use database function with venue filter parameter
      const venueFilter = selectedVenue === 'all' ? null : selectedVenue;
      const { data, error } = await supabase.rpc('get_weekly_revenue_summary', {
        venue_filter: venueFilter,
        week_date: null
      });

      if (error) {
        console.error('Error fetching weekly revenue data:', error);
        return;
      }

      // Transform database results to component format
      const weeklyArray: WeeklyRevenue[] = data?.map((row: any) => ({
        week_start: new Date(row.week_start).toISOString().split('T')[0],
        total_transactions: Number(row.total_transactions),
        door_transactions: Number(row.door_transactions),
        bar_transactions: Number(row.bar_transactions),
        door_revenue_dollars: Math.round((Number(row.door_revenue_cents) / 100) * 100) / 100,
        bar_revenue_dollars: Math.round((Number(row.bar_revenue_cents) / 100) * 100) / 100,
        total_revenue_dollars: Math.round((Number(row.total_revenue_cents) / 100) * 100) / 100
      })) || [];

      setWeeklyData(weeklyArray);
      
      // Calculate total transactions
      const totalTransactions = weeklyArray.reduce((sum, week) => sum + week.total_transactions, 0);
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

  const formatWeek = (weekString: string) => {
    const weekStart = new Date(weekString);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Summary</h1>
          <p className="text-muted-foreground">Revenue grouped by time period ({totalCount} total transactions)</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="venue-select" className="text-sm font-medium">
              Venue:
            </label>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All Venues</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue} value={venue}>
                    {venue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-4">
            <RevenueStackedChart
              monthlyData={monthlyData}
              activeTab={activeTab}
              selectedVenue={selectedVenue}
              isLoading={isLoading}
            />
            <Card>
              <CardHeader>
                <CardTitle>
                  Monthly Revenue Breakdown
                  {selectedVenue !== 'all' && (
                    <span className="text-base font-normal text-muted-foreground ml-2">
                      - {selectedVenue}
                    </span>
                  )}
                </CardTitle>
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
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-4">
            <RevenueStackedChart
              weeklyData={weeklyData}
              activeTab={activeTab}
              selectedVenue={selectedVenue}
              isLoading={isLoading}
            />
            <Card>
              <CardHeader>
                <CardTitle>
                  Weekly Revenue Breakdown
                  {selectedVenue !== 'all' && (
                    <span className="text-base font-normal text-muted-foreground ml-2">
                      - {selectedVenue}
                    </span>
                  )}
                </CardTitle>
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
                        <TableHead>Week</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Door Revenue</TableHead>
                        <TableHead className="text-right">Bar Revenue</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyData.map((weekData) => (
                        <TableRow key={weekData.week_start}>
                          <TableCell className="font-medium">
                            {formatWeek(weekData.week_start)}
                          </TableCell>
                          <TableCell className="text-right">
                            {weekData.total_transactions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(weekData.door_revenue_dollars)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(weekData.bar_revenue_dollars)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(weekData.total_revenue_dollars)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RevenueNew;