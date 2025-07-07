import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RevenueRow {
  period: string;
  totalDollars: number;
  totalPercent: number | null;
  barDollars: number;
  barPercent: number | null;
  doorDollars: number;
  doorPercent: number | null;
}

export const RevenueComparisonTable = () => {
  const [data, setData] = useState<RevenueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch current week, month, year and their comparisons using SQL functions
        const [weeklyData, monthlyData, yearlyData] = await Promise.all([
          supabase.rpc('get_weekly_revenue_summary'),
          supabase.rpc('get_monthly_revenue_summary'), 
          supabase.rpc('get_yearly_revenue_summary')
        ]);

        if (weeklyData.error) console.error('Weekly data error:', weeklyData.error);
        if (monthlyData.error) console.error('Monthly data error:', monthlyData.error);
        if (yearlyData.error) console.error('Yearly data error:', yearlyData.error);

        const weeks = weeklyData.data || [];
        const months = monthlyData.data || [];
        const years = yearlyData.data || [];

        // Get current and previous periods
        const currentWeek = weeks[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const lastWeek = weeks[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        
        const currentMonth = months[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const lastMonth = months[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        
        const currentYear = years[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const lastYear = years[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };

        const calculatePercent = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const formatDollars = (cents: number) => cents / 100;

        const tableData: RevenueRow[] = [
          // Actual values (first 3 rows)
          {
            period: 'Current Week',
            totalDollars: formatDollars(currentWeek.total_revenue_cents),
            totalPercent: null,
            barDollars: formatDollars(currentWeek.bar_revenue_cents),
            barPercent: null,
            doorDollars: formatDollars(currentWeek.door_revenue_cents),
            doorPercent: null,
          },
          {
            period: 'Current Month',
            totalDollars: formatDollars(currentMonth.total_revenue_cents),
            totalPercent: null,
            barDollars: formatDollars(currentMonth.bar_revenue_cents),
            barPercent: null,
            doorDollars: formatDollars(currentMonth.door_revenue_cents),
            doorPercent: null,
          },
          {
            period: 'Current Year',
            totalDollars: formatDollars(currentYear.total_revenue_cents),
            totalPercent: null,
            barDollars: formatDollars(currentYear.bar_revenue_cents),
            barPercent: null,
            doorDollars: formatDollars(currentYear.door_revenue_cents),
            doorPercent: null,
          },
          // Comparison values (next 3 rows)
          {
            period: 'vs Last Week',
            totalDollars: formatDollars(currentWeek.total_revenue_cents),
            totalPercent: calculatePercent(currentWeek.total_revenue_cents, lastWeek.total_revenue_cents),
            barDollars: formatDollars(currentWeek.bar_revenue_cents),
            barPercent: calculatePercent(currentWeek.bar_revenue_cents, lastWeek.bar_revenue_cents),
            doorDollars: formatDollars(currentWeek.door_revenue_cents),
            doorPercent: calculatePercent(currentWeek.door_revenue_cents, lastWeek.door_revenue_cents),
          },
          {
            period: 'vs Last Month',
            totalDollars: formatDollars(currentMonth.total_revenue_cents),
            totalPercent: calculatePercent(currentMonth.total_revenue_cents, lastMonth.total_revenue_cents),
            barDollars: formatDollars(currentMonth.bar_revenue_cents),
            barPercent: calculatePercent(currentMonth.bar_revenue_cents, lastMonth.bar_revenue_cents),
            doorDollars: formatDollars(currentMonth.door_revenue_cents),
            doorPercent: calculatePercent(currentMonth.door_revenue_cents, lastMonth.door_revenue_cents),
          },
          {
            period: 'vs Last Year',
            totalDollars: formatDollars(currentYear.total_revenue_cents),
            totalPercent: calculatePercent(currentYear.total_revenue_cents, lastYear.total_revenue_cents),
            barDollars: formatDollars(currentYear.bar_revenue_cents),
            barPercent: calculatePercent(currentYear.bar_revenue_cents, lastYear.bar_revenue_cents),
            doorDollars: formatDollars(currentYear.door_revenue_cents),
            doorPercent: calculatePercent(currentYear.door_revenue_cents, lastYear.door_revenue_cents),
          },
        ];

        setData(tableData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '—';
    if (value === 0) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getPercentColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Comparison</CardTitle>
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
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total $</TableHead>
                <TableHead className="text-right">Total %</TableHead>
                <TableHead className="text-right">Bar $</TableHead>
                <TableHead className="text-right">Bar %</TableHead>
                <TableHead className="text-right">Door $</TableHead>
                <TableHead className="text-right">Door %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={row.period}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.totalDollars)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", getPercentColor(row.totalPercent))}>
                    {formatPercent(row.totalPercent)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.barDollars)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", getPercentColor(row.barPercent))}>
                    {formatPercent(row.barPercent)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.doorDollars)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", getPercentColor(row.doorPercent))}>
                    {formatPercent(row.doorPercent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};