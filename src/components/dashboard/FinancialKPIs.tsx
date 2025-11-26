
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingBag, Shield, Calendar } from "lucide-react";
import { FinancialKPIs as KPIs } from "@/services/financialService";

interface FinancialKPIsProps {
  kpis: KPIs | null;
  isLoading: boolean;
}

export function FinancialKPIs({ kpis, isLoading }: FinancialKPIsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
    // Row 1: Profit / Revenue / Bookings
    {
      title: "Net Profit",
      icon: TrendingUp,
      headline: formatPercent(kpis.netProfit.changePercent),
      subheader: formatCurrency(kpis.netProfit.total),
      changePercent: kpis.netProfit.changePercent,
      trend: kpis.netProfit.changePercent >= 0 ? "up" : "down",
      isCost: false,
      dollarAmount: kpis.netProfit.total,
      previousDollarAmount: kpis.netProfit.previousTotal,
      currentMargin: kpis.netProfit.marginPercent,
      previousMargin: kpis.netProfit.previousMarginPercent
    },
    {
      title: "Total Revenue",
      icon: DollarSign,
      headline: formatPercent(kpis.revenue.changePercent),
      subheader: formatCurrency(kpis.revenue.total),
      changePercent: kpis.revenue.changePercent,
      trend: kpis.revenue.changePercent >= 0 ? "up" : "down",
      isCost: false,
      dollarAmount: kpis.revenue.total,
      previousDollarAmount: kpis.revenue.previousTotal
    },
    {
      title: "Bookings",
      icon: Calendar,
      headline: formatPercent(kpis.bookings.changePercent),
      subheader: kpis.bookings.total.toLocaleString(),
      changePercent: kpis.bookings.changePercent,
      trend: kpis.bookings.changePercent >= 0 ? "up" : "down",
      isCost: false,
      breakdown: kpis.bookings.breakdown
    },
    // Row 2: Wages / COGS / Security
    {
      title: "Wages",
      icon: Users,
      headline: formatPercent(kpis.wages.changePercent),
      subheader: `${kpis.wages.percentOfRevenue.toFixed(1)}% of Revenue`,
      changePercent: kpis.wages.changePercent,
      dollarAmount: kpis.wages.total,
      previousDollarAmount: kpis.wages.previousTotal,
      trend: kpis.wages.changePercent <= 0 ? "up" : "down", // Inverted: decrease is good
      isCost: true
    },
    {
      title: "COGS",
      icon: ShoppingBag,
      headline: formatPercent(kpis.cogs.changePercent),
      subheader: `${kpis.cogs.percentOfRevenue.toFixed(1)}% of Revenue`,
      changePercent: kpis.cogs.changePercent,
      dollarAmount: kpis.cogs.total,
      previousDollarAmount: kpis.cogs.previousTotal,
      trend: kpis.cogs.changePercent <= 0 ? "up" : "down", // Inverted: decrease is good
      isCost: true
    },
    {
      title: "Security",
      icon: Shield,
      headline: formatPercent(kpis.security.changePercent),
      subheader: `${kpis.security.percentOfRevenue.toFixed(1)}% of Revenue`,
      changePercent: kpis.security.changePercent,
      dollarAmount: kpis.security.total,
      previousDollarAmount: kpis.security.previousTotal,
      trend: kpis.security.changePercent <= 0 ? "up" : "down", // Inverted: decrease is good
      isCost: true
    }
  ];

  return (
    <div>
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const cardContent = (
              <Card className={(card.dollarAmount !== undefined || card.breakdown || card.previousDollarAmount !== undefined) ? "cursor-help" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {card.trend === "up" && <span className="text-green-600">↑</span>}
                    {card.trend === "down" && <span className="text-red-600">↓</span>}
                    <span className={card.trend === "up" ? "text-green-600" : card.trend === "down" ? "text-red-600" : ""}>
                      {card.headline}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subheader}
                  </p>
                </CardContent>
              </Card>
            );

            // Add tooltip for cards with dollar amounts, breakdown, or previous period data
            if (card.dollarAmount !== undefined || card.breakdown || card.previousDollarAmount !== undefined) {
              return (
                <Tooltip key={card.title}>
                  <TooltipTrigger asChild>
                    {cardContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    {card.breakdown ? (
                      <div className="space-y-1">
                        <p className="font-medium mb-2">Booking Breakdown</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between gap-4">
                            <span>Tickets:</span>
                            <span className="font-medium">{card.breakdown.tickets}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Karaoke:</span>
                            <span className="font-medium">{card.breakdown.karaoke}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Venue Hire:</span>
                            <span className="font-medium">{card.breakdown.venueHire}</span>
                          </div>
                        </div>
                      </div>
                    ) : card.previousDollarAmount !== undefined ? (
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span>Last 28 Days:</span>
                          <span className="font-medium">
                            {formatCurrency(card.dollarAmount!)}
                            {card.currentMargin !== undefined && (
                              <span className="text-muted-foreground ml-1">
                                ({card.currentMargin.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Previous Period:</span>
                          <span className="font-medium">
                            {formatCurrency(card.previousDollarAmount)}
                            {card.previousMargin !== undefined && (
                              <span className="text-muted-foreground ml-1">
                                ({card.previousMargin.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium">
                        {formatCurrency(card.dollarAmount!)}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={card.title}>{cardContent}</div>;
          })}
        </div>
      </TooltipProvider>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        These stats show the last 28 days
      </p>
    </div>
  );
}

