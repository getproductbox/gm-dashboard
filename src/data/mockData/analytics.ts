
export interface AnalyticsData {
  id: string;
  metric: string;
  value: number;
  change: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export const mockAnalytics: AnalyticsData[] = [
  {
    id: '1',
    metric: 'Total Users',
    value: 1247,
    change: 12.5,
    period: 'monthly',
    date: '2024-06-24'
  },
  {
    id: '2',
    metric: 'Revenue',
    value: 45820,
    change: -3.2,
    period: 'monthly',
    date: '2024-06-24'
  },
  {
    id: '3',
    metric: 'Conversion Rate',
    value: 3.8,
    change: 8.1,
    period: 'weekly',
    date: '2024-06-24'
  },
  {
    id: '4',
    metric: 'Page Views',
    value: 23456,
    change: 15.7,
    period: 'daily',
    date: '2024-06-24'
  }
];

export const mockChartData: ChartData[] = [
  { name: 'Jan', value: 4000, date: '2024-01-01' },
  { name: 'Feb', value: 3000, date: '2024-02-01' },
  { name: 'Mar', value: 5000, date: '2024-03-01' },
  { name: 'Apr', value: 4500, date: '2024-04-01' },
  { name: 'May', value: 6000, date: '2024-05-01' },
  { name: 'Jun', value: 5500, date: '2024-06-01' }
];

export const mockTrafficSources = [
  { name: 'Organic Search', value: 45 },
  { name: 'Direct', value: 25 },
  { name: 'Social Media', value: 15 },
  { name: 'Email', value: 10 },
  { name: 'Referral', value: 5 }
];
