import { RevenueRow } from './types';
import { calculatePercent, formatDollars } from './utils';

interface RevenueData {
  total_revenue_cents: number;
  bar_revenue_cents: number;
  door_revenue_cents: number;
}

interface ProcessRevenueDataParams {
  weeklyData: RevenueData[];
  monthlyData: RevenueData[];
  yearlyData: RevenueData[];
  selectedDate: Date | null;
}

export const processRevenueData = ({ 
  weeklyData, 
  monthlyData, 
  yearlyData, 
  selectedDate 
}: ProcessRevenueDataParams): RevenueRow[] => {
  // Get current and previous periods using array indexing
  const currentWeek = weeklyData[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
  const currentMonth = monthlyData[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
  const currentYear = yearlyData[0] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };

  // Previous periods are the second item in each array
  const lastWeek = weeklyData[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
  const lastMonth = monthlyData[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };
  const lastYear = yearlyData[1] || { total_revenue_cents: 0, bar_revenue_cents: 0, door_revenue_cents: 0 };

  const weekLabel = selectedDate ? 'Selected Week' : 'Current Week';
  const monthLabel = selectedDate ? 'Selected Month' : 'Current Month';
  const yearLabel = selectedDate ? 'Selected Year' : 'Current Year';

  return [
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
};