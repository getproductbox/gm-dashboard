import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

type LocationFilter = 'all' | 'hippie' | 'manor';

export const RevenueDashboard = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationFilter>('all');
  const [currentWeek, setCurrentWeek] = useState<PeriodMetrics>({ totalRevenue: 0, barRevenue: 0, doorRevenue: 0 });
  const [lastWeekComparison, setLastWeekComparison] = useState<ComparisonMetrics>({ totalVariance: 0, barVariance: 0, doorVariance: 0 });
  const [lastMonthComparison, setLastMonthComparison] = useState<ComparisonMetrics>({ totalVariance: 0, barVariance: 0, doorVariance: 0 });
  const [lastYearComparison, setLastYearComparison] = useState<ComparisonMetrics>({ totalVariance: 0, barVariance: 0, doorVariance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const getDateRanges = () => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastMonthStart = new Date(currentWeekStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(lastMonthStart);
    lastMonthEnd.setDate(lastMonthStart.getDate() + 6);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const lastYearStart = new Date(currentWeekStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date(lastYearStart);
    lastYearEnd.setDate(lastYearStart.getDate() + 6);
    lastYearEnd.setHours(23, 59, 59, 999);

    return {
      currentWeek: { start: currentWeekStart, end: currentWeekEnd },
      lastWeek: { start: lastWeekStart, end: lastWeekEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      lastYear: { start: lastYearStart, end: lastYearEnd }
    };
  };

  const fetchPeriodMetrics = async (startDate: Date, endDate: Date, location: LocationFilter): Promise<PeriodMetrics> => {
    let query = supabase
      .from('revenue_events')
      .select('*')
      .eq('status', 'completed')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString());

    if (location !== 'all') {
      query = query.eq('venue', location);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    const events = (data || []) as RevenueEvent[];
    console.log(`Found ${events.length} events for period ${startDate.toISOString()} to ${endDate.toISOString()}, location: ${location}`);
    
    const totalRevenue = events.reduce((sum, event) => sum + event.amount_cents, 0);
    
    // For now, treat all 'other' revenue as bar revenue since that's what the data contains
    // In the future, this categorization should be handled in the Square sync process
    const barRevenue = events.filter(e => e.revenue_type === 'other').reduce((sum, event) => sum + event.amount_cents, 0);
    const doorRevenue = events.filter(e => e.revenue_type === 'door').reduce((sum, event) => sum + event.amount_cents, 0);

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
        fetchPeriodMetrics(ranges.currentWeek.start, ranges.currentWeek.end, selectedLocation),
        fetchPeriodMetrics(ranges.lastWeek.start, ranges.lastWeek.end, selectedLocation),
        fetchPeriodMetrics(ranges.lastMonth.start, ranges.lastMonth.end, selectedLocation),
        fetchPeriodMetrics(ranges.lastYear.start, ranges.lastYear.end, selectedLocation)
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
  }, [selectedLocation]);

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
      {/* Header with Location Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={selectedLocation === 'hippie' ? 'default' : 'outline'}
            onClick={() => setSelectedLocation('hippie')}
            size="sm"
          >
            Hippie
          </Button>
          <Button
            variant={selectedLocation === 'manor' ? 'default' : 'outline'}
            onClick={() => setSelectedLocation('manor')}
            size="sm"
          >
            Manor
          </Button>
          <Button
            variant={selectedLocation === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedLocation('all')}
            size="sm"
          >
            All
          </Button>
        </div>
      </div>

      {/* Current Week Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Week</h2>
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