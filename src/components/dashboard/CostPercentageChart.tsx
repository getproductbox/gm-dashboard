
import { useState } from "react";
import { WeeklyFinancials } from "@/services/financialService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format, parseISO } from "date-fns";

interface CostPercentageChartProps {
  data: WeeklyFinancials[];
  isLoading: boolean;
}

type CostCategory = 'wages' | 'cogs' | 'security';

const COST_CATEGORIES: Array<{ key: CostCategory; label: string; color: string }> = [
  { key: 'wages', label: 'Wages', color: '#f87171' },
  { key: 'cogs', label: 'COGS', color: '#fbbf24' },
  { key: 'security', label: 'Security', color: '#a78bfa' },
];

export function CostPercentageChart({ data, isLoading }: CostPercentageChartProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<CostCategory>>(
    new Set(['wages', 'cogs', 'security'])
  );
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost as % of Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Filter out the last week if it has no revenue (same as Revenue chart)
  const filteredData = data.filter((item, index) => {
    // If it's the last week (index === data.length - 1) and has no revenue, exclude it
    if (index === data.length - 1 && item.revenue === 0) {
      return false;
    }
    return true;
  });

  // Calculate 4-week trend (comparing current week to 4 weeks ago)
  const chartData = filteredData.map((item, index) => {
    // If revenue is very low (< $100), percentage calculations blow up. 
    // Filter out weeks with negligible revenue to avoid chart spikes, 
    // or clamp the value? 
    // For now, let's just calculate raw %, but maybe cap visually?
    const revenue = item.revenue > 100 ? item.revenue : 1; 
    
    // Calculate 4-week trend (comparing to 4 weeks ago)
    let trendRate = 0;
    if (index >= 4) {
      const fourWeeksAgoRevenue = filteredData[index - 4].revenue;
      if (fourWeeksAgoRevenue > 0) {
        trendRate = ((item.revenue - fourWeeksAgoRevenue) / fourWeeksAgoRevenue) * 100;
      }
    } else if (index > 0) {
      // For weeks 1-3, compare to the first week
      const firstWeekRevenue = filteredData[0].revenue;
      if (firstWeekRevenue > 0) {
        trendRate = ((item.revenue - firstWeekRevenue) / firstWeekRevenue) * 100;
      }
    }
    
    // If revenue is basically 0, these will be 0 (if item.wages is normal) / 1 * 100 = huge.
    // If revenue is 0, maybe we should return 0 percentages or null?
    if (item.revenue <= 100) {
      return {
        date: format(parseISO(item.weekStart), "MMM d"),
        wages: 0,
        wagesAmount: 0,
        cogs: 0,
        cogsAmount: 0,
        security: 0,
        securityAmount: 0,
        trendRate: 0,
        revenueTooLow: true
      };
    }

    return {
      date: format(parseISO(item.weekStart), "MMM d"),
      wages: (item.wages / revenue) * 100,
      wagesAmount: item.wages,
      cogs: (item.cogs / revenue) * 100,
      cogsAmount: item.cogs,
      security: (item.security / revenue) * 100,
      securityAmount: item.security,
      trendRate
    };
  });

  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const handleCategoryToggle = (category: CostCategory) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.size === COST_CATEGORIES.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(COST_CATEGORIES.map(c => c.key)));
    }
  };

  const selectedCategoriesArray = Array.from(selectedCategories);
  const isAllSelected = selectedCategories.size === COST_CATEGORIES.length;

  // Determine which bar should have rounded corners (the last one in the stack)
  const getRadius = (category: CostCategory): [number, number, number, number] => {
    const selected = selectedCategoriesArray;
    const index = selected.indexOf(category);
    const isLast = index === selected.length - 1;
    return isLast ? [4, 4, 0, 0] : [0, 0, 0, 0];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cost as % of Revenue</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                All
              </Label>
            </div>
            {COST_CATEGORIES.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`category-${key}`}
                  checked={selectedCategories.has(key)}
                  onCheckedChange={() => handleCategoryToggle(key)}
                />
                <Label htmlFor={`category-${key}`} className="text-sm cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedCategories.size === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Select at least one cost category to display
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(val) => `${val}%`} 
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)}%`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="mb-2 font-medium">{label}</div>
                        <div className="space-y-1">
                          {payload.map((item, index) => {
                            if (item.name === '4-Week Trend') {
                              return (
                                <div key={index} className="flex items-center justify-between gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-muted-foreground">{item.name}</span>
                                  </div>
                                  <span className="font-medium">
                                    {item.value && Number(item.value) > 0 ? '+' : ''}
                                    {formatPercent(Number(item.value) || 0)}
                                  </span>
                                </div>
                              );
                            }
                            
                            // For cost categories, show both percentage and dollar amount
                            const amountKey = `${item.dataKey}Amount` as keyof typeof item.payload;
                            const amount = item.payload?.[amountKey] as number | undefined;
                            
                            return (
                              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-muted-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(amount || 0)}</div>
                                  <div className="text-xs text-muted-foreground">{formatPercent(Number(item.value) || 0)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                
                {selectedCategories.has('wages') && (
                  <Bar 
                    yAxisId="left"
                    dataKey="wages" 
                    name="Wages %" 
                    stackId="a" 
                    fill={COST_CATEGORIES.find(c => c.key === 'wages')?.color} 
                    radius={getRadius('wages')} 
                  />
                )}
                {selectedCategories.has('cogs') && (
                  <Bar 
                    yAxisId="left"
                    dataKey="cogs" 
                    name="COGS %" 
                    stackId="a" 
                    fill={COST_CATEGORIES.find(c => c.key === 'cogs')?.color} 
                    radius={getRadius('cogs')} 
                  />
                )}
                {selectedCategories.has('security') && (
                  <Bar 
                    yAxisId="left"
                    dataKey="security" 
                    name="Security %" 
                    stackId="a" 
                    fill={COST_CATEGORIES.find(c => c.key === 'security')?.color} 
                    radius={getRadius('security')} 
                  />
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="trendRate"
                  name="4-Week Trend"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#16a34a" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
