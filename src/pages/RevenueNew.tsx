import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MonthlyRevenue {
  month: string;
  year: number;
  barRevenue: number;
  doorRevenue: number;
  totalRevenue: number;
}

const RevenueNew = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyRevenue();
  }, []);

  const fetchMonthlyRevenue = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('payment_date, revenue_type, amount_cents')
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching revenue:', error);
        return;
      }

      console.log('Raw data count:', data?.length);
      console.log('Sample raw data:', data?.slice(0, 5));

      if (!data || data.length === 0) {
        setMonthlyData([]);
        return;
      }

      // Group by month and calculate totals with robust error handling
      const monthlyMap = new Map<string, MonthlyRevenue>();
      const processingErrors: string[] = [];
      
      data.forEach((event, index) => {
        try {
          // Validate the event data
          if (!event.payment_date || event.amount_cents === null || event.amount_cents === undefined) {
            processingErrors.push(`Record ${index}: Missing required fields`);
            return;
          }

          // More robust date parsing
          const date = new Date(event.payment_date);
          
          // Validate the parsed date
          if (isNaN(date.getTime())) {
            processingErrors.push(`Record ${index}: Invalid date - ${event.payment_date}`);
            return;
          }

          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = format(date, 'MMM yyyy');
          
          console.log(`Processing record ${index}: ${event.payment_date} -> ${monthKey} (${monthName})`);
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthName,
              year: date.getFullYear(),
              barRevenue: 0,
              doorRevenue: 0,
              totalRevenue: 0
            });
          }
          
          const monthData = monthlyMap.get(monthKey)!;
          const amountDollars = event.amount_cents / 100;
          
          if (event.revenue_type === 'bar') {
            monthData.barRevenue += amountDollars;
          } else if (event.revenue_type === 'door') {
            monthData.doorRevenue += amountDollars;
          }
          
          monthData.totalRevenue += amountDollars;
        } catch (recordError) {
          processingErrors.push(`Record ${index}: ${recordError}`);
          console.error(`Error processing record ${index}:`, recordError, event);
        }
      });

      // Log any processing errors
      if (processingErrors.length > 0) {
        console.warn('Processing errors:', processingErrors);
      }

      // Convert to array and sort by year-month key (newest first)
      const sortedData = Array.from(monthlyMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, value]) => value);

      console.log('Final processed monthly data:', sortedData);
      console.log('Month keys found:', Array.from(monthlyMap.keys()).sort());
      setMonthlyData(sortedData);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue New</h1>
          <p className="text-muted-foreground">Monthly revenue breakdown over the last 12 months</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
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
                    <TableHead className="text-right">Bar Revenue</TableHead>
                    <TableHead className="text-right">Door Revenue</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.barRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.doorRevenue)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.totalRevenue)}</TableCell>
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