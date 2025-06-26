
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RevenueCharts } from './RevenueCharts';
import { RevenueTable } from './RevenueTable';
import { RevenueFilters } from './RevenueFilters';

interface RevenueEvent {
  id: string;
  square_payment_id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  currency: string;
  payment_date: string;
  payment_hour: number;
  payment_day_of_week: number;
  status: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

interface RevenueSummary {
  totalRevenue: number;
  barRevenue: number;
  doorRevenue: number;
  otherRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
}

export const RevenueDashboard = () => {
  const [revenueData, setRevenueData] = useState<RevenueEvent[]>([]);
  const [filteredData, setFilteredData] = useState<RevenueEvent[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>({
    totalRevenue: 0,
    barRevenue: 0,
    doorRevenue: 0,
    otherRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('revenue_events')
        .select('*')
        .eq('status', 'completed')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      
      setRevenueData(data || []);
      setFilteredData(data || []);
      
      // Calculate summary
      if (data) {
        const total = data.reduce((sum, event) => sum + event.amount_cents, 0);
        const barTotal = data.filter(e => e.revenue_type === 'bar').reduce((sum, event) => sum + event.amount_cents, 0);
        const doorTotal = data.filter(e => e.revenue_type === 'door').reduce((sum, event) => sum + event.amount_cents, 0);
        const otherTotal = data.filter(e => e.revenue_type === 'other').reduce((sum, event) => sum + event.amount_cents, 0);
        
        setSummary({
          totalRevenue: total,
          barRevenue: barTotal,
          doorRevenue: doorTotal,
          otherRevenue: otherTotal,
          totalTransactions: data.length,
          averageTransaction: data.length > 0 ? total / data.length : 0
        });
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const handleFilterChange = (filters: any) => {
    let filtered = [...revenueData];

    if (filters.dateRange?.from) {
      filtered = filtered.filter(event => 
        new Date(event.payment_date) >= filters.dateRange.from
      );
    }

    if (filters.dateRange?.to) {
      filtered = filtered.filter(event => 
        new Date(event.payment_date) <= filters.dateRange.to
      );
    }

    if (filters.revenueType && filters.revenueType !== 'all') {
      filtered = filtered.filter(event => event.revenue_type === filters.revenueType);
    }

    if (filters.venue && filters.venue !== 'all') {
      filtered = filtered.filter(event => event.venue === filters.venue);
    }

    setFilteredData(filtered);

    // Recalculate summary for filtered data
    const total = filtered.reduce((sum, event) => sum + event.amount_cents, 0);
    const barTotal = filtered.filter(e => e.revenue_type === 'bar').reduce((sum, event) => sum + event.amount_cents, 0);
    const doorTotal = filtered.filter(e => e.revenue_type === 'door').reduce((sum, event) => sum + event.amount_cents, 0);
    const otherTotal = filtered.filter(e => e.revenue_type === 'other').reduce((sum, event) => sum + event.amount_cents, 0);
    
    setSummary({
      totalRevenue: total,
      barRevenue: barTotal,
      doorRevenue: doorTotal,
      otherRevenue: otherTotal,
      totalTransactions: filtered.length,
      averageTransaction: filtered.length > 0 ? total / filtered.length : 0
    });
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {filteredData.length} transactions
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bar Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.barRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((summary.barRevenue / summary.totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Door Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.doorRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((summary.doorRevenue / summary.totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageTransaction)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <RevenueFilters 
        revenueData={revenueData} 
        onFilterChange={handleFilterChange}
      />

      {/* Tabs for different views */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <RevenueCharts data={filteredData} />
        </TabsContent>

        <TabsContent value="table">
          <RevenueTable data={filteredData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
