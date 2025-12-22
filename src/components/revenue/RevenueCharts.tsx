
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, parseISO } from 'date-fns';

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

interface RevenueChartsProps {
  data: RevenueEvent[];
}

interface DailyRevenueItem {
  date: string;
  total: number;
  bar: number;
  door: number;
  other: number;
}

interface HourlyRevenueItem {
  hour: string;
  amount: number;
  count: number;
}

const COLORS = {
  bar: '#8884d8',
  door: '#82ca9d', 
  other: '#ffc658'
};

export const RevenueCharts = ({ data }: RevenueChartsProps) => {
  // Group data by date
  const dailyRevenue = data.reduce((acc, event) => {
    const date = format(parseISO(event.payment_date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { date, total: 0, bar: 0, door: 0, other: 0 };
    }
    acc[date].total += event.amount_cents;
    acc[date][event.revenue_type] += event.amount_cents;
    return acc;
  }, {} as Record<string, DailyRevenueItem>);

  const dailyRevenueArray = Object.values(dailyRevenue)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      total: item.total / 100,
      bar: item.bar / 100,
      door: item.door / 100,
      other: item.other / 100,
    }));

  // Group data by revenue type
  const revenueByType = data.reduce((acc, event) => {
    if (!acc[event.revenue_type]) {
      acc[event.revenue_type] = 0;
    }
    acc[event.revenue_type] += event.amount_cents;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(revenueByType).map(([type, amount]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: amount / 100,
    color: COLORS[type as keyof typeof COLORS]
  }));

  // Group data by hour
  const hourlyRevenue = data.reduce((acc, event) => {
    const hour = event.payment_hour;
    if (!acc[hour]) {
      acc[hour] = { hour: `${hour}:00`, amount: 0, count: 0 };
    }
    acc[hour].amount += event.amount_cents;
    acc[hour].count += 1;
    return acc;
  }, {} as Record<number, HourlyRevenueItem>);

  const hourlyRevenueArray = Object.values(hourlyRevenue)
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    .map((item) => ({
      ...item,
      amount: item.amount / 100
    }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Revenue Trend */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenueArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => format(parseISO(label), 'MMM dd, yyyy')}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Revenue Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyRevenueArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Bar dataKey="amount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stacked Daily Revenue by Type */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Daily Revenue by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenueArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => format(parseISO(label), 'MMM dd, yyyy')}
              />
              <Bar dataKey="bar" stackId="a" fill={COLORS.bar} name="Bar" />
              <Bar dataKey="door" stackId="a" fill={COLORS.door} name="Door" />
              <Bar dataKey="other" stackId="a" fill={COLORS.other} name="Other" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
