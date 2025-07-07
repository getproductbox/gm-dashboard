import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRevenueDashboard } from '@/hooks/useRevenueDashboard';

interface ComparisonData {
  period: string;
  totalDollars: number;
  totalPercent: number;
  barDollars: number;
  barPercent: number;
  doorDollars: number;
  doorPercent: number;
}

export const RevenueComparisonTable = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const {
    isLoading,
    currentPeriod,
    lastWeekComparison,
    lastMonthComparison,
    lastYearComparison,
    fetchAllMetrics
  } = useRevenueDashboard();

  // Set default to current week
  useEffect(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of current week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);
    
    setStartDate(weekStart);
    setEndDate(weekEnd);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllMetrics(startDate, endDate);
    }
  }, [startDate, endDate, fetchAllMetrics]);

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

  const comparisonData: ComparisonData[] = [
    {
      period: 'Current Period',
      totalDollars: currentPeriod.totalRevenue,
      totalPercent: 0, // Baseline
      barDollars: currentPeriod.barRevenue,
      barPercent: 0, // Baseline
      doorDollars: currentPeriod.doorRevenue,
      doorPercent: 0, // Baseline
    },
    {
      period: 'vs Previous Period',
      totalDollars: currentPeriod.totalRevenue,
      totalPercent: lastWeekComparison.totalVariance,
      barDollars: currentPeriod.barRevenue,
      barPercent: lastWeekComparison.barVariance,
      doorDollars: currentPeriod.doorRevenue,
      doorPercent: lastWeekComparison.doorVariance,
    },
    {
      period: 'vs Same Period Last Month',
      totalDollars: currentPeriod.totalRevenue,
      totalPercent: lastMonthComparison.totalVariance,
      barDollars: currentPeriod.barRevenue,
      barPercent: lastMonthComparison.barVariance,
      doorDollars: currentPeriod.doorRevenue,
      doorPercent: lastMonthComparison.doorVariance,
    },
    {
      period: 'vs Same Period Last Year',
      totalDollars: currentPeriod.totalRevenue,
      totalPercent: lastYearComparison.totalVariance,
      barDollars: currentPeriod.barRevenue,
      barPercent: lastYearComparison.barVariance,
      doorDollars: currentPeriod.doorRevenue,
      doorPercent: lastYearComparison.doorVariance,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Comparison</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setStartOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setEndOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
              {comparisonData.map((row, index) => (
                <TableRow key={row.period}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.totalDollars)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", getPercentColor(row.totalPercent))}>
                    {index === 0 ? '—' : formatPercent(row.totalPercent)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.barDollars)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", getPercentColor(row.barPercent))}>
                    {index === 0 ? '—' : formatPercent(row.barPercent)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.doorDollars)}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", getPercentColor(row.doorPercent))}>
                    {index === 0 ? '—' : formatPercent(row.doorPercent)}
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