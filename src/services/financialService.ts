
import { supabase } from "@/integrations/supabase/client";
import { fetchPnl, PnlResponse } from "./xeroService";
import { startOfWeek, endOfWeek, subWeeks, format, addDays } from "date-fns";

export interface WeeklyFinancials {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  wages: number;
  cogs: number;
  security: number;
  marketing: number;
  otherExpenses: number;
  totalExpenses: number;
  netProfit: number;
  marginPercent: number;
}

export interface FinancialKPIs {
  revenue: { total: number; changePercent: number };
  netProfit: { total: number; marginPercent: number };
  wages: { total: number; percentOfRevenue: number };
  cogs: { total: number; percentOfRevenue: number };
}

export const financialService = {
  async fetchWeeklyFinancials(weeksBack: number = 8): Promise<WeeklyFinancials[]> {
    try {
      const today = new Date();
      // Align to start of current week (Monday)
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      
      // Generate week ranges
      const weeks = Array.from({ length: weeksBack }).map((_, i) => {
        const start = subWeeks(currentWeekStart, i);
        const end = endOfWeek(start, { weekStartsOn: 1 });
        return {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd'),
          dateObj: start
        };
      }).reverse(); // Oldest first

      // 1. Fetch Revenue (using RPC or direct query)
      // We'll use the RPC if possible, but we need to filter by specific weeks.
      // Alternatively, we can fetch all revenue for the period and aggregate in JS.
      const startDate = weeks[0].start;
      const endDate = weeks[weeks.length - 1].end;

      const { data: revenueData, error: revenueError } = await supabase.rpc('get_weekly_revenue_summary', {
        venue_filter: null,
        week_date: null 
      });

      if (revenueError) {
        console.error('Error fetching revenue:', revenueError);
        throw new Error('Failed to fetch revenue data');
      }

      // 2. Fetch Costs (Xero P&L for each week)
      // Run in parallel
      const costPromises = weeks.map(week => 
        fetchPnl(week.start, week.end)
          .catch(err => {
            console.warn(`Failed to fetch P&L for ${week.start}:`, err);
            return null;
          })
      );

      const costResults = await Promise.all(costPromises);

      // 3. Combine Data
      const financials: WeeklyFinancials[] = weeks.map((week, index) => {
        // Find revenue for this week
        // RPC returns `week_start` as timestamp string
        const weekRevenueRow = revenueData?.find((r: any) => {
          const rowDate = new Date(r.week_start);
          return format(rowDate, 'yyyy-MM-dd') === week.start;
        });

        const revenueCents = weekRevenueRow?.total_revenue_cents || 0;
        // Convert to GST Exclusive Dollars (divide by 100 then 1.1)
        const revenue = (revenueCents / 100) / 1.1;

        const costs = costResults[index];
        
        // Extract categories
        let wages = 0;
        let cogs = 0;
        let security = 0;
        let marketing = 0;
        let totalExpenses = 0;

        if (costs) {
          const cats = costs.categories || {};
          wages = cats['wages'] || 0;
          cogs = cats['cogs'] || 0;
          security = cats['security'] || 0;
          marketing = cats['marketing'] || 0; // If mapped
          
          totalExpenses = costs.totals.expenses;
        }

        const otherExpenses = totalExpenses - (wages + cogs + security + marketing);
        const netProfit = revenue - totalExpenses;
        const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
          weekStart: week.start,
          weekEnd: week.end,
          revenue,
          wages,
          cogs,
          security,
          marketing,
          otherExpenses,
          totalExpenses,
          netProfit,
          marginPercent
        };
      });

      return financials;

    } catch (error) {
      console.error('Error in fetchWeeklyFinancials:', error);
      throw error;
    }
  },

  async fetchKPIs(weeksToAnalyze: number = 4): Promise<FinancialKPIs> {
    const financials = await this.fetchWeeklyFinancials(weeksToAnalyze * 2); // Fetch double range for comparison
    
    // Split into current and previous periods
    const currentPeriod = financials.slice(-weeksToAnalyze);
    const previousPeriod = financials.slice(-weeksToAnalyze * 2, -weeksToAnalyze);

    const sum = (items: WeeklyFinancials[], key: keyof WeeklyFinancials) => 
      items.reduce((acc, item) => acc + (item[key] as number), 0);

    const currentRevenue = sum(currentPeriod, 'revenue');
    const previousRevenue = sum(previousPeriod, 'revenue');
    
    const currentWages = sum(currentPeriod, 'wages');
    const currentCogs = sum(currentPeriod, 'cogs');
    const currentNetProfit = sum(currentPeriod, 'netProfit');

    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const wagePercent = currentRevenue > 0 ? (currentWages / currentRevenue) * 100 : 0;
    const cogsPercent = currentRevenue > 0 ? (currentCogs / currentRevenue) * 100 : 0;
    const netProfitMargin = currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;

    return {
      revenue: {
        total: currentRevenue,
        changePercent: revenueChange
      },
      netProfit: {
        total: currentNetProfit,
        marginPercent: netProfitMargin
      },
      wages: {
        total: currentWages,
        percentOfRevenue: wagePercent
      },
      cogs: {
        total: currentCogs,
        percentOfRevenue: cogsPercent
      }
    };
  }
};

