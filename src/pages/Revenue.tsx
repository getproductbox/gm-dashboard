
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface YearlyRevenue {
  year_start: string;
  total_transactions: number;
  door_transactions: number;
  bar_transactions: number;
  door_revenue_dollars: number;
  bar_revenue_dollars: number;
  total_revenue_dollars: number;
}

interface RevenueSummaryRow {
  month?: string;
  week_start?: string;
  year_start?: string;
  total_transactions: number;
  door_transactions: number;
  bar_transactions: number;
  door_revenue_cents: number;
  bar_revenue_cents: number;
  total_revenue_cents: number;
}

export default function Revenue() {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyRevenue[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [venues, setVenues] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('monthly');

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    fetchRevenueData();
  }, [selectedVenue, activeTab]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('venue')
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching venues:', error);
        return;
      }

      // Get unique venues from the data
      const uniqueVenues = [...new Set(data?.map(row => row.venue))].sort() || [];
      setVenues(uniqueVenues);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      
      const venueFilter = selectedVenue === 'all' ? null : selectedVenue;

      if (activeTab === 'monthly') {
        await fetchMonthlyRevenue(venueFilter);
      } else if (activeTab === 'weekly') {
        await fetchWeeklyRevenue(venueFilter);
      } else if (activeTab === 'yearly') {
        await fetchYearlyRevenue(venueFilter);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyRevenue = async (venueFilter: string | null) => {
    const { data, error } = await supabase.rpc('get_monthly_revenue_summary', {
      venue_filter: venueFilter,
      month_date: null
    });

    if (error) {
      console.error('Error fetching monthly revenue data:', error);
      return;
    }

    const monthlyArray: MonthlyRevenue[] = data?.map((row) => ({
      month: new Date(row.month).toISOString().split('T')[0],
      total_transactions: Number(row.total_transactions),
      door_transactions: Number(row.door_transactions),
      bar_transactions: Number(row.bar_transactions),
      door_revenue_dollars: Math.round((Number(row.door_revenue_cents) / 100) * 100) / 100,
      bar_revenue_dollars: Math.round((Number(row.bar_revenue_cents) / 100) * 100) / 100,
      total_revenue_dollars: Math.round((Number(row.total_revenue_cents) / 100) * 100) / 100
    })) || [];

    setMonthlyData(monthlyArray);
    const totalTransactions = monthlyArray.reduce((sum, month) => sum + month.total_transactions, 0);
    setTotalCount(totalTransactions);
  };

  const fetchWeeklyRevenue = async (venueFilter: string | null) => {
    const { data, error } = await supabase.rpc('get_weekly_revenue_summary', {
      venue_filter: venueFilter,
      week_date: null
    });

    if (error) {
      console.error('Error fetching weekly revenue data:', error);
      return;
    }

    const weeklyArray: WeeklyRevenue[] = data?.map((row) => ({
      week_start: new Date(row.week_start).toISOString().split('T')[0],
      total_transactions: Number(row.total_transactions),
      door_transactions: Number(row.door_transactions),
      bar_transactions: Number(row.bar_transactions),
      door_revenue_dollars: Math.round((Number(row.door_revenue_cents) / 100) * 100) / 100,
      bar_revenue_dollars: Math.round((Number(row.bar_revenue_cents) / 100) * 100) / 100,
      total_revenue_dollars: Math.round((Number(row.total_revenue_cents) / 100) * 100) / 100
    })) || [];

    setWeeklyData(weeklyArray);
    const totalTransactions = weeklyArray.reduce((sum, week) => sum + week.total_transactions, 0);
    setTotalCount(totalTransactions);
  };

  const fetchYearlyRevenue = async (venueFilter: string | null) => {
    const { data, error } = await supabase.rpc('get_yearly_revenue_summary', {
      venue_filter: venueFilter,
      year_date: null
    });

    if (error) {
      console.error('Error fetching yearly revenue data:', error);
      return;
    }

    const yearlyArray: YearlyRevenue[] = data?.map((row) => ({
      year_start: new Date(row.year_start).toISOString().split('T')[0],
      total_transactions: Number(row.total_transactions),
      door_transactions: Number(row.door_transactions),
      bar_transactions: Number(row.bar_transactions),
      door_revenue_dollars: Math.round((Number(row.door_revenue_cents) / 100) * 100) / 100,
      bar_revenue_dollars: Math.round((Number(row.bar_revenue_cents) / 100) * 100) / 100,
      total_revenue_dollars: Math.round((Number(row.total_revenue_cents) / 100) * 100) / 100
    })) || [];

    setYearlyData(yearlyArray);
    const totalTransactions = yearlyArray.reduce((sum, year) => sum + year.total_transactions, 0);
    setTotalCount(totalTransactions);
  };

  const formatCurrency = (amount: number) => {
    // Convert from GST inclusive to GST exclusive by dividing by 1.1
    const gstExclusiveAmount = amount / 1.1;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(gstExclusiveAmount);
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

  const formatYear = (yearString: string) => {
    return format(new Date(yearString), 'yyyy');
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'monthly':
        return monthlyData;
      case 'weekly':
        return weeklyData;
      case 'yearly':
        return yearlyData;
      default:
        return monthlyData;
    }
  };

  const getFormatFunction = () => {
    switch (activeTab) {
      case 'monthly':
        return formatMonth;
      case 'weekly':
        return formatWeek;
      case 'yearly':
        return formatYear;
      default:
        return formatMonth;
    }
  };

  const getPeriodKey = () => {
    switch (activeTab) {
      case 'monthly':
        return 'month';
      case 'weekly':
        return 'week_start';
      case 'yearly':
        return 'year_start';
      default:
        return 'month';
    }
  };

  const currentData = getCurrentData();
  const formatFunction = getFormatFunction();
  const periodKey = getPeriodKey();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">
            Revenue performance across different time periods ({totalCount} total transactions)
          </p>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
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

          <TabsContent value="yearly" className="space-y-4">
            <RevenueStackedChart
              yearlyData={yearlyData}
              activeTab={activeTab}
              selectedVenue={selectedVenue}
              isLoading={isLoading}
            />
            <Card>
              <CardHeader>
                <CardTitle>
                  Yearly Revenue Breakdown
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
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Door Revenue</TableHead>
                        <TableHead className="text-right">Bar Revenue</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyData.map((yearData) => (
                        <TableRow key={yearData.year_start}>
                          <TableCell className="font-medium">
                            {formatYear(yearData.year_start)}
                          </TableCell>
                          <TableCell className="text-right">
                            {yearData.total_transactions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(yearData.door_revenue_dollars)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(yearData.bar_revenue_dollars)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(yearData.total_revenue_dollars)}
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
}
