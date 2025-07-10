import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRevenue } from '@/hooks/useRevenue';

interface RevenueRow {
  period: string;
  totalDollars: number;
  totalPercent: number | null;
  barDollars: number;
  barPercent: number | null;
  doorDollars: number;
  doorPercent: number | null;
}

interface RevenueComparisonTableProps {
  selectedVenue?: string | null;
}

export const RevenueComparisonTable = ({ selectedVenue }: RevenueComparisonTableProps) => {
  const [data, setData] = useState<RevenueRow[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [availableWeeks, setAvailableWeeks] = useState<Array<{ week_start: string; week_label: string }>>([]);
  const { isLoading, fetchWeeklyData, fetchMonthlyData, fetchYearlyData, fetchAvailableWeeks } = useRevenue();

  useEffect(() => {
    const loadAvailableWeeks = async () => {
      try {
        const weeks = await fetchAvailableWeeks();
        setAvailableWeeks(weeks);
      } catch (error) {
        console.error('Error loading available weeks:', error);
      }
    };
    loadAvailableWeeks();
  }, [fetchAvailableWeeks]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const selectedDate = selectedWeek === 'current' ? null : new Date(selectedWeek);
        
        // Make only 3 database calls - each function returns multiple periods
        const [weeklyData, monthlyData, yearlyData] = await Promise.all([
          fetchWeeklyData(selectedVenue, selectedDate),
          fetchMonthlyData(selectedVenue, selectedDate),
          fetchYearlyData(selectedVenue, selectedDate)
        ]);

        // Get current and previous periods using array indexing
        const currentWeek = weeklyData[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const currentMonth = monthlyData[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const currentYear = yearlyData[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };

        // Previous periods are the second item in each array
        const lastWeek = weeklyData[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const lastMonth = monthlyData[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
        const lastYear = yearlyData[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };

        const calculatePercent = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const formatDollars = (cents: number) => cents / 100;

        const weekLabel = selectedDate ? 'Selected Week' : 'Current Week';
        const monthLabel = selectedDate ? 'Selected Month' : 'Current Month';
        const yearLabel = selectedDate ? 'Selected Year' : 'Current Year';

        const tableData: RevenueRow[] = [
          // Current values
          {
            period: weekLabel,
            totalDollars: formatDollars(currentWeek.total_revenue_cents),
            totalPercent: null,
            barDollars: formatDollars(currentWeek.bar_revenue_cents),
            barPercent: null,
            doorDollars: formatDollars(currentWeek.door_revenue_cents),
            doorPercent: null,
          },
          {
            period: monthLabel,
            totalDollars: formatDollars(currentMonth.total_revenue_cents),
            totalPercent: null,
            barDollars: formatDollars(currentMonth.bar_revenue_cents),
            barPercent: null,
            doorDollars: formatDollars(currentMonth.door_revenue_cents),
            doorPercent: null,
          },
          {
            period: yearLabel,
            totalDollars: formatDollars(currentYear.total_revenue_cents),
            totalPercent: null,
            barDollars: formatDollars(currentYear.bar_revenue_cents),
            barPercent: null,
            doorDollars: formatDollars(currentYear.door_revenue_cents),
            doorPercent: null,
          },
          // Comparison values
          {
            period: 'vs Last Week',
            totalDollars: formatDollars(lastWeek.total_revenue_cents),
            totalPercent: calculatePercent(currentWeek.total_revenue_cents, lastWeek.total_revenue_cents),
            barDollars: formatDollars(lastWeek.bar_revenue_cents),
            barPercent: calculatePercent(currentWeek.bar_revenue_cents, lastWeek.bar_revenue_cents),
            doorDollars: formatDollars(lastWeek.door_revenue_cents),
            doorPercent: calculatePercent(currentWeek.door_revenue_cents, lastWeek.door_revenue_cents),
          },
          {
            period: 'vs Last Month',
            totalDollars: formatDollars(lastMonth.total_revenue_cents),
            totalPercent: calculatePercent(currentMonth.total_revenue_cents, lastMonth.total_revenue_cents),
            barDollars: formatDollars(lastMonth.bar_revenue_cents),
            barPercent: calculatePercent(currentMonth.bar_revenue_cents, lastMonth.bar_revenue_cents),
            doorDollars: formatDollars(lastMonth.door_revenue_cents),
            doorPercent: calculatePercent(currentMonth.door_revenue_cents, lastMonth.door_revenue_cents),
          },
          {
            period: 'vs Last Year',
            totalDollars: formatDollars(lastYear.total_revenue_cents),
            totalPercent: calculatePercent(currentYear.total_revenue_cents, lastYear.total_revenue_cents),
            barDollars: formatDollars(lastYear.bar_revenue_cents),
            barPercent: calculatePercent(currentYear.bar_revenue_cents, lastYear.bar_revenue_cents),
            doorDollars: formatDollars(lastYear.door_revenue_cents),
            doorPercent: calculatePercent(currentYear.door_revenue_cents, lastYear.door_revenue_cents),
          },
        ];

        setData(tableData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      }
    };

    fetchData();
  }, [selectedWeek, selectedVenue, fetchWeeklyData, fetchMonthlyData, fetchYearlyData]);

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
      <CardHeader className="space-y-4">
        <CardTitle>Revenue Comparison</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor="week-selector" className="text-sm font-medium">
            Select Week:
          </label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Week</SelectItem>
              {availableWeeks.map((week) => (
                <SelectItem key={week.week_start} value={week.week_start}>
                  {week.week_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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