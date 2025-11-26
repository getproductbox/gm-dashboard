
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingBag } from "lucide-react";
import { FinancialKPIs as KPIs } from "@/services/financialService";

interface FinancialKPIsProps {
  kpis: KPIs | null;
  isLoading: boolean;
}

export function FinancialKPIs({ kpis, isLoading }: FinancialKPIsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => 
    `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;

  const cards = [
    {
      title: "Total Revenue",
      icon: DollarSign,
      value: formatCurrency(kpis.revenue.total),
      subValue: `${formatPercent(kpis.revenue.changePercent)} from previous period`,
      trend: kpis.revenue.changePercent >= 0 ? "up" : "down"
    },
    {
      title: "Net Profit",
      icon: TrendingUp,
      value: formatCurrency(kpis.netProfit.total),
      subValue: `${kpis.netProfit.marginPercent.toFixed(1)}% Margin`,
      trend: kpis.netProfit.total >= 0 ? "up" : "down"
    },
    {
      title: "Wages",
      icon: Users,
      value: formatCurrency(kpis.wages.total),
      subValue: `${kpis.wages.percentOfRevenue.toFixed(1)}% of Revenue`,
      // For costs, "up" trend might be bad, but here we show context
      trend: "neutral" 
    },
    {
      title: "COGS",
      icon: ShoppingBag,
      value: formatCurrency(kpis.cogs.total),
      subValue: `${kpis.cogs.percentOfRevenue.toFixed(1)}% of Revenue`,
      trend: "neutral"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.trend === "up" && <span className="text-green-600 mr-1">↑</span>}
              {card.trend === "down" && <span className="text-red-600 mr-1">↓</span>}
              {card.subValue}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

