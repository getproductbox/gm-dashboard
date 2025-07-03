import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, ArrowUp, ArrowDown, Minus, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RevenueEvent {
  id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  payment_date: string;
  status: string;
}

interface PeriodMetrics {
  totalRevenue: number;
  barRevenue: number;
  doorRevenue: number;
}

interface ComparisonMetrics {
  totalVariance: number;
  barVariance: number;
  doorVariance: number;
}



export const RevenueDashboard = () => {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(new Date(2024, 7, 1)); // August 1, 2024
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(new Date(2024, 7, 7)); // August 7, 2024
  const [currentWeek, setCurrentWeek] = useState<PeriodMetrics>({ totalRevenue: 0, barRevenue: 0, doorRevenue: 0 });
  const [lastWeekComparison, setLastWeekComparison] = useState<ComparisonMetrics>({ totalVariance: 0, barVariance: 0, doorVariance: 0 });
  const [lastMonthComparison, setLastMonthComparison] = useState<ComparisonMetrics>({ totalVariance: 0, barVariance: 0, doorVariance: 0 });
  const [lastYearComparison, setLastYearComparison] = useState<ComparisonMetrics>({ totalVariance: 0, barVariance: 0, doorVariance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const getDateRanges = () => {
    // Use selected dates or default to current week if not selected
    const currentStart = selectedStartDate || new Date();
    const currentEnd = selectedEndDate || new Date();
    
    // Ensure start is beginning of day, end is end of day
    const currentWeekStart = new Date(currentStart);
    currentWeekStart.setHours(0, 0, 0, 0);
    const currentWeekEnd = new Date(currentEnd);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Calculate comparison periods based on the length of selected period
    const periodLengthDays = Math.ceil((currentWeekEnd.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - periodLengthDays - 1);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + periodLengthDays);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastMonthStart = new Date(currentWeekStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(lastMonthStart);
    lastMonthEnd.setDate(lastMonthStart.getDate() + periodLengthDays);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const lastYearStart = new Date(currentWeekStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date(lastYearStart);
    lastYearEnd.setDate(lastYearStart.getDate() + periodLengthDays);
    lastYearEnd.setHours(23, 59, 59, 999);

    return {
      currentWeek: { start: currentWeekStart, end: currentWeekEnd },
      lastWeek: { start: lastWeekStart, end: lastWeekEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      lastYear: { start: lastYearStart, end: lastYearEnd }
    };
  };

  const fetchPeriodMetrics = async (startDate: Date, endDate: Date): Promise<PeriodMetrics> => {
    let query = supabase
      .from('revenue_events')
      .select('*')
      .eq('status', 'completed')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString());

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    const events = (data || []) as RevenueEvent[];
    console.log(`Found ${events.length} events for period ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const totalRevenue = events.reduce((sum, event) => sum + event.amount_cents, 0);
    
    // For now, show all revenue as "bar" revenue since we don't have proper categorization
    // This will be fixed when the Square sync properly categorizes payments
    const barRevenue = totalRevenue;
    const doorRevenue = 0;

    console.log(`Period metrics: total=${totalRevenue}, bar=${barRevenue}, door=${doorRevenue}`);
    return { totalRevenue, barRevenue, doorRevenue };
  };

  const calculateVariance = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchAllMetrics = async () => {
    setIsLoading(true);
    try {
      const ranges = getDateRanges();

      const [currentWeekMetrics, lastWeekMetrics, lastMonthMetrics, lastYearMetrics] = await Promise.all([
        fetchPeriodMetrics(ranges.currentWeek.start, ranges.currentWeek.end),
        fetchPeriodMetrics(ranges.lastWeek.start, ranges.lastWeek.end),
        fetchPeriodMetrics(ranges.lastMonth.start, ranges.lastMonth.end),
        fetchPeriodMetrics(ranges.lastYear.start, ranges.lastYear.end)
      ]);

      setCurrentWeek(currentWeekMetrics);

      setLastWeekComparison({
        totalVariance: calculateVariance(currentWeekMetrics.totalRevenue, lastWeekMetrics.totalRevenue),
        barVariance: calculateVariance(currentWeekMetrics.barRevenue, lastWeekMetrics.barRevenue),
        doorVariance: calculateVariance(currentWeekMetrics.doorRevenue, lastWeekMetrics.doorRevenue)
      });

      setLastMonthComparison({
        totalVariance: calculateVariance(currentWeekMetrics.totalRevenue, lastMonthMetrics.totalRevenue),
        barVariance: calculateVariance(currentWeekMetrics.barRevenue, lastMonthMetrics.barRevenue),
        doorVariance: calculateVariance(currentWeekMetrics.doorRevenue, lastMonthMetrics.doorRevenue)
      });

      setLastYearComparison({
        totalVariance: calculateVariance(currentWeekMetrics.totalRevenue, lastYearMetrics.totalRevenue),
        barVariance: calculateVariance(currentWeekMetrics.barRevenue, lastYearMetrics.barRevenue),
        doorVariance: calculateVariance(currentWeekMetrics.doorRevenue, lastYearMetrics.doorRevenue)
      });

    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMetrics();
  }, [selectedStartDate, selectedEndDate]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatPercentage = (value: number) => {
    if (currentWeek.totalRevenue === 0) return 0;
    return Math.round((value / currentWeek.totalRevenue) * 100);
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (variance < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Revenue Dashboard</h1>
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
      </div>

      {/* Date Filter */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="text-sm font-medium mb-3">Select Date Range</h3>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !selectedStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedStartDate ? format(selectedStartDate, "MMM d, yyyy") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedStartDate}
                  onSelect={setSelectedStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !selectedEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedEndDate ? format(selectedEndDate, "MMM d, yyyy") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedEndDate}
                  onSelect={setSelectedEndDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col">
            <div className="text-xs text-muted-foreground mb-1">&nbsp;</div>
            <Button 
              onClick={fetchAllMetrics}
              disabled={!selectedStartDate || !selectedEndDate}
            >
              Update
            </Button>
          </div>
        </div>
      </div>

      {/* Current Period Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Selected Period
          {selectedStartDate && selectedEndDate && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({format(selectedStartDate, "MMM d")} - {format(selectedEndDate, "MMM d, yyyy")})
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bar Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentWeek.barRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(currentWeek.barRevenue)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Door Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentWeek.doorRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(currentWeek.doorRevenue)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparison Sections */}
      <div className="space-y-6">
        {/* VS Last Week */}
        <div>
          <h2 className="text-xl font-semibold mb-4">VS Last Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                {getVarianceIcon(lastWeekComparison.totalVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastWeekComparison.totalVariance)}`}>
                  {lastWeekComparison.totalVariance > 0 ? '+' : ''}{lastWeekComparison.totalVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bar Revenue</CardTitle>
                {getVarianceIcon(lastWeekComparison.barVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastWeekComparison.barVariance)}`}>
                  {lastWeekComparison.barVariance > 0 ? '+' : ''}{lastWeekComparison.barVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Door Revenue</CardTitle>
                {getVarianceIcon(lastWeekComparison.doorVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastWeekComparison.doorVariance)}`}>
                  {lastWeekComparison.doorVariance > 0 ? '+' : ''}{lastWeekComparison.doorVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* VS Last Month */}
        <div>
          <h2 className="text-xl font-semibold mb-4">VS Last Month</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                {getVarianceIcon(lastMonthComparison.totalVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastMonthComparison.totalVariance)}`}>
                  {lastMonthComparison.totalVariance > 0 ? '+' : ''}{lastMonthComparison.totalVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bar Revenue</CardTitle>
                {getVarianceIcon(lastMonthComparison.barVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastMonthComparison.barVariance)}`}>
                  {lastMonthComparison.barVariance > 0 ? '+' : ''}{lastMonthComparison.barVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Door Revenue</CardTitle>
                {getVarianceIcon(lastMonthComparison.doorVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastMonthComparison.doorVariance)}`}>
                  {lastMonthComparison.doorVariance > 0 ? '+' : ''}{lastMonthComparison.doorVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* VS Last Year */}
        <div>
          <h2 className="text-xl font-semibold mb-4">VS Last Year</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                {getVarianceIcon(lastYearComparison.totalVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastYearComparison.totalVariance)}`}>
                  {lastYearComparison.totalVariance > 0 ? '+' : ''}{lastYearComparison.totalVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bar Revenue</CardTitle>
                {getVarianceIcon(lastYearComparison.barVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastYearComparison.barVariance)}`}>
                  {lastYearComparison.barVariance > 0 ? '+' : ''}{lastYearComparison.barVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Door Revenue</CardTitle>
                {getVarianceIcon(lastYearComparison.doorVariance)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(lastYearComparison.doorVariance)}`}>
                  {lastYearComparison.doorVariance > 0 ? '+' : ''}{lastYearComparison.doorVariance.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};