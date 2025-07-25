import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface RevenueChartData {
  period: string;
  Door: number;
  Bar: number;
  total: number;
}

interface RevenueStackedChartProps {
  monthlyData?: Array<{
    month: string;
    door_revenue_dollars: number;
    bar_revenue_dollars: number;
    total_revenue_dollars: number;
  }>;
  weeklyData?: Array<{
    week_start: string;
    door_revenue_dollars: number;
    bar_revenue_dollars: number;
    total_revenue_dollars: number;
  }>;
  yearlyData?: Array<{
    year_start: string;
    door_revenue_dollars: number;
    bar_revenue_dollars: number;
    total_revenue_dollars: number;
  }>;
  activeTab: string;
  selectedVenue: string;
  isLoading: boolean;
}

export const RevenueStackedChart = ({ 
  monthlyData = [], 
  weeklyData = [], 
  yearlyData = [],
  activeTab, 
  selectedVenue, 
  isLoading 
}: RevenueStackedChartProps) => {
  const formatMonth = (monthString: string) => {
    return format(new Date(monthString), 'MMM yyyy');
  };

  const formatWeek = (weekString: string) => {
    const weekStart = new Date(weekString);
    return format(weekStart, 'MMM dd');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatYear = (yearString: string) => {
    return format(new Date(yearString), 'yyyy');
  };

  const chartData: RevenueChartData[] = activeTab === 'monthly' 
    ? monthlyData.map(item => ({
        period: formatMonth(item.month),
        Door: item.door_revenue_dollars,
        Bar: item.bar_revenue_dollars,
        total: item.total_revenue_dollars
      }))
    : activeTab === 'weekly'
    ? weeklyData.map(item => ({
        period: formatWeek(item.week_start),
        Door: item.door_revenue_dollars,
        Bar: item.bar_revenue_dollars,
        total: item.total_revenue_dollars
      }))
    : yearlyData.map(item => ({
        period: formatYear(item.year_start),
        Door: item.door_revenue_dollars,
        Bar: item.bar_revenue_dollars,
        total: item.total_revenue_dollars
      }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className="font-medium text-sm border-t border-border pt-1 mt-1">
            Total: {formatCurrency(total)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {activeTab === 'monthly' ? 'Monthly' : activeTab === 'weekly' ? 'Weekly' : 'Yearly'} Revenue Chart
          {selectedVenue !== 'all' && (
            <span className="text-base font-normal text-muted-foreground ml-2">
              - {selectedVenue}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex justify-center items-center h-80">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="period" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="Door" 
                  stackId="revenue" 
                  fill="hsl(var(--primary))" 
                  name="Door Revenue"
                />
                <Bar 
                  dataKey="Bar" 
                  stackId="revenue" 
                  fill="hsl(var(--secondary))" 
                  name="Bar Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};