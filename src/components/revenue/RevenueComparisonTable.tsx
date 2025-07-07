import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ComparisonData {
  period: string;
  totalDollars: number;
  totalPercent: number;
  barDollars: number;
  barPercent: number;
  doorDollars: number;
  doorPercent: number;
}

interface PeriodData {
  current: { start: Date; end: Date };
  comparison: { start: Date; end: Date };
  metrics: any;
  comparisonMetrics: any;
}

export const RevenueComparisonTable = () => {
  const [weekData, setWeekData] = useState<PeriodData | null>(null);
  const [monthData, setMonthData] = useState<PeriodData | null>(null);
  const [yearData, setYearData] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPeriodMetrics = useCallback(async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('revenue_events')
      .select('*')
      .eq('status', 'completed')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString());

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    const events = data || [];
    const totalRevenue = events.reduce((sum, event) => sum + event.amount_cents, 0);
    const barRevenue = events
      .filter(event => event.revenue_type === 'bar')
      .reduce((sum, event) => sum + event.amount_cents, 0);
    const doorRevenue = events
      .filter(event => event.revenue_type === 'door')
      .reduce((sum, event) => sum + event.amount_cents, 0);

    return { 
      totalRevenue, 
      barRevenue, 
      doorRevenue,
      eventCount: events.length
    };
  }, []);

  const calculateVariance = useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const getCurrentWeek = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { start: weekStart, end: weekEnd };
  };

  const getLastWeek = () => {
    const currentWeek = getCurrentWeek();
    const lastWeekStart = new Date(currentWeek.start);
    lastWeekStart.setDate(currentWeek.start.getDate() - 7);
    
    const lastWeekEnd = new Date(currentWeek.end);
    lastWeekEnd.setDate(currentWeek.end.getDate() - 7);
    
    return { start: lastWeekStart, end: lastWeekEnd };
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    return { start: monthStart, end: monthEnd };
  };

  const getLastMonth = () => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    lastMonthEnd.setHours(23, 59, 59, 999);
    
    return { start: lastMonthStart, end: lastMonthEnd };
  };

  const getCurrentYear = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);
    
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    yearEnd.setHours(23, 59, 59, 999);
    
    return { start: yearStart, end: yearEnd };
  };

  const getLastYear = () => {
    const now = new Date();
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    lastYearStart.setHours(0, 0, 0, 0);
    
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    lastYearEnd.setHours(23, 59, 59, 999);
    
    return { start: lastYearStart, end: lastYearEnd };
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Get date ranges
        const currentWeek = getCurrentWeek();
        const lastWeek = getLastWeek();
        const currentMonth = getCurrentMonth();
        const lastMonth = getLastMonth();
        const currentYear = getCurrentYear();
        const lastYear = getLastYear();

        // Fetch all metrics in parallel
        const [
          weekMetrics,
          lastWeekMetrics,
          monthMetrics,
          lastMonthMetrics,
          yearMetrics,
          lastYearMetrics
        ] = await Promise.all([
          fetchPeriodMetrics(currentWeek.start, currentWeek.end),
          fetchPeriodMetrics(lastWeek.start, lastWeek.end),
          fetchPeriodMetrics(currentMonth.start, currentMonth.end),
          fetchPeriodMetrics(lastMonth.start, lastMonth.end),
          fetchPeriodMetrics(currentYear.start, currentYear.end),
          fetchPeriodMetrics(lastYear.start, lastYear.end)
        ]);

        setWeekData({
          current: currentWeek,
          comparison: lastWeek,
          metrics: weekMetrics,
          comparisonMetrics: lastWeekMetrics
        });

        setMonthData({
          current: currentMonth,
          comparison: lastMonth,
          metrics: monthMetrics,
          comparisonMetrics: lastMonthMetrics
        });

        setYearData({
          current: currentYear,
          comparison: lastYear,
          metrics: yearMetrics,
          comparisonMetrics: lastYearMetrics
        });

      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [fetchPeriodMetrics]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    if (value === 0) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getPercentColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const buildComparisonData = (): ComparisonData[] => {
    if (!weekData || !monthData || !yearData) return [];

    return [
      {
        period: 'Current Week vs Last Week',
        totalDollars: weekData.metrics.totalRevenue,
        totalPercent: calculateVariance(weekData.metrics.totalRevenue, weekData.comparisonMetrics.totalRevenue),
        barDollars: weekData.metrics.barRevenue,
        barPercent: calculateVariance(weekData.metrics.barRevenue, weekData.comparisonMetrics.barRevenue),
        doorDollars: weekData.metrics.doorRevenue,
        doorPercent: calculateVariance(weekData.metrics.doorRevenue, weekData.comparisonMetrics.doorRevenue),
      },
      {
        period: 'Current Month vs Last Month',
        totalDollars: monthData.metrics.totalRevenue,
        totalPercent: calculateVariance(monthData.metrics.totalRevenue, monthData.comparisonMetrics.totalRevenue),
        barDollars: monthData.metrics.barRevenue,
        barPercent: calculateVariance(monthData.metrics.barRevenue, monthData.comparisonMetrics.barRevenue),
        doorDollars: monthData.metrics.doorRevenue,
        doorPercent: calculateVariance(monthData.metrics.doorRevenue, monthData.comparisonMetrics.doorRevenue),
      },
      {
        period: 'Current Year vs Last Year',
        totalDollars: yearData.metrics.totalRevenue,
        totalPercent: calculateVariance(yearData.metrics.totalRevenue, yearData.comparisonMetrics.totalRevenue),
        barDollars: yearData.metrics.barRevenue,
        barPercent: calculateVariance(yearData.metrics.barRevenue, yearData.comparisonMetrics.barRevenue),
        doorDollars: yearData.metrics.doorRevenue,
        doorPercent: calculateVariance(yearData.metrics.doorRevenue, yearData.comparisonMetrics.doorRevenue),
      },
    ];
  };

  const comparisonData = buildComparisonData();

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
              {comparisonData.map((row) => (
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