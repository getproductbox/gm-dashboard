
import { useState, useEffect } from "react";
import { WeeklyFinancials } from "@/services/financialService";
import { benchmarkService, CostBenchmarks } from "@/services/benchmarkService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChevronDown, Check } from "lucide-react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";

interface CostPercentageChartProps {
  data: WeeklyFinancials[];
  isLoading: boolean;
}

type CostCategory = 'wages' | 'cogs' | 'security';
type TimeScale = 'weekly' | 'monthly';

const COST_CATEGORIES: Array<{ key: CostCategory; label: string; color: string }> = [
  { key: 'wages', label: 'Wages', color: '#f87171' },
  { key: 'cogs', label: 'COGS', color: '#fbbf24' },
  { key: 'security', label: 'Security', color: '#a78bfa' },
];

const chartConfig = {
  wages: {
    label: "Wages",
    color: "#f87171",
  },
  cogs: {
    label: "COGS",
    color: "#fbbf24",
  },
  security: {
    label: "Security",
    color: "#a78bfa",
  },
};

export function CostPercentageChart({ data, isLoading }: CostPercentageChartProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<CostCategory>>(
    new Set(['wages', 'cogs', 'security'])
  );
  const [timeScale, setTimeScale] = useState<TimeScale>('weekly');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [benchmarks, setBenchmarks] = useState<CostBenchmarks | null>(null);

  // Fetch benchmarks on mount
  useEffect(() => {
    const loadBenchmarks = async () => {
      try {
        const data = await benchmarkService.getBenchmarks();
        setBenchmarks(data);
      } catch (_error) {
        // Silent fail for benchmark loading
      }
    };
    loadBenchmarks();
  }, []);

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

  // Aggregate weekly data into monthly if monthly time scale is selected
  const aggregatedData = timeScale === 'monthly' 
    ? aggregateToMonthly(filteredData)
    : filteredData;

  // Helper function to aggregate weekly data into monthly
  function aggregateToMonthly(weeklyData: WeeklyFinancials[]): WeeklyFinancials[] {
    const monthlyMap = new Map<string, WeeklyFinancials>();
    
    weeklyData.forEach(week => {
      const monthKey = format(startOfMonth(parseISO(week.weekStart)), 'yyyy-MM');
      const existing = monthlyMap.get(monthKey);
      
      if (existing) {
        existing.revenue += week.revenue;
        existing.wages += week.wages;
        existing.cogs += week.cogs;
        existing.security += week.security;
      } else {
        monthlyMap.set(monthKey, {
          ...week,
          weekStart: format(startOfMonth(parseISO(week.weekStart)), 'yyyy-MM-dd'),
          weekEnd: week.weekEnd,
        });
      }
    });
    
    return Array.from(monthlyMap.values()).sort((a, b) => 
      new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    );
  }

  // Calculate cost percentages
  const chartData = aggregatedData.map((item) => {
    // If revenue is very low (< $100), percentage calculations blow up. 
    const revenue = item.revenue > 100 ? item.revenue : 1; 
    
    // If revenue is basically 0, return 0 percentages
    if (item.revenue <= 100) {
      return {
        date: timeScale === 'weekly' 
          ? format(parseISO(item.weekStart), "MMM d")
          : format(parseISO(item.weekStart), "MMM yyyy"),
        wages: 0,
        wagesAmount: 0,
        cogs: 0,
        cogsAmount: 0,
        security: 0,
        securityAmount: 0,
      };
    }

    return {
      date: timeScale === 'weekly' 
        ? format(parseISO(item.weekStart), "MMM d")
        : format(parseISO(item.weekStart), "MMM yyyy"),
      wages: (item.wages / revenue) * 100,
      wagesAmount: item.wages,
      cogs: (item.cogs / revenue) * 100,
      cogsAmount: item.cogs,
      security: (item.security / revenue) * 100,
      securityAmount: item.security,
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

  const getDropdownLabel = () => {
    if (selectedCategories.size === 0) return "Select costs";
    if (selectedCategories.size === COST_CATEGORIES.length) return "All Costs";
    return Array.from(selectedCategories)
      .map(key => COST_CATEGORIES.find(c => c.key === key)?.label)
      .join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cost as % of Revenue</CardTitle>
          <div className="flex items-center gap-4">
            <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40 justify-between">
                  <span className="truncate">{getDropdownLabel()}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2" align="end">
                <div className="space-y-1">
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                    onClick={handleSelectAll}
                  >
                    <div className={`h-4 w-4 border rounded-sm flex items-center justify-center ${isAllSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                      {isAllSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">All</span>
                  </div>
                  <div className="h-px bg-border my-1" />
                  {COST_CATEGORIES.map(({ key, label, color }) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                      onClick={() => handleCategoryToggle(key)}
                    >
                      <div className={`h-4 w-4 border rounded-sm flex items-center justify-center ${selectedCategories.has(key) ? 'bg-primary border-primary' : 'border-input'}`}>
                        {selectedCategories.has(key) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Tabs value={timeScale} onValueChange={(value) => setTimeScale(value as TimeScale)}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedCategories.size === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Select at least one cost category to display
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-96 w-full">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
                domain={[0, (dataMax: number) => {
                  // Include benchmark in the y-axis domain if it's higher than the data
                  const totalBenchmark = benchmarks 
                    ? Array.from(selectedCategories).reduce((sum, cat) => sum + benchmarks[cat], 0)
                    : 0;
                  const maxValue = Math.max(dataMax, totalBenchmark);
                  // Add 10% padding
                  return Math.ceil(maxValue * 1.1);
                }]}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="grid gap-1">
                          {payload.map((item, index) => {
                            // For cost categories, show both percentage and dollar amount
                            const amountKey = `${item.dataKey}Amount` as keyof typeof item.payload;
                            const amount = item.payload?.[amountKey] as number | undefined;
                            
                            return (
                              <div key={index} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-xs text-muted-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-medium">{formatCurrency(amount || 0)}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({formatPercent(Number(item.value) || 0)})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <ChartLegend
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <ChartLegendContent
                      payload={payload}
                      className="mt-4"
                    />
                  );
                }}
              />
                
                {selectedCategories.has('wages') && (
                  <Bar 
                    yAxisId="left"
                    dataKey="wages" 
                    name="Wages" 
                    stackId="a" 
                    fill={COST_CATEGORIES.find(c => c.key === 'wages')?.color} 
                    radius={getRadius('wages')} 
                  />
                )}
                {selectedCategories.has('cogs') && (
                  <Bar 
                    yAxisId="left"
                    dataKey="cogs" 
                    name="COGS" 
                    stackId="a" 
                    fill={COST_CATEGORIES.find(c => c.key === 'cogs')?.color} 
                    radius={getRadius('cogs')} 
                  />
                )}
                {selectedCategories.has('security') && (
                  <Bar 
                    yAxisId="left"
                    dataKey="security" 
                    name="Security" 
                    stackId="a" 
                    fill={COST_CATEGORIES.find(c => c.key === 'security')?.color} 
                    radius={getRadius('security')} 
                  />
                )}
                
                {/* Benchmark reference line - single category */}
                {benchmarks && selectedCategories.size === 1 && (() => {
                  const category = Array.from(selectedCategories)[0];
                  const benchmarkValue = benchmarks[category];
                  const categoryConfig = COST_CATEGORIES.find(c => c.key === category);
                  return benchmarkValue > 0 && categoryConfig ? (
                    <ReferenceLine
                      yAxisId="left"
                      y={benchmarkValue}
                      stroke={categoryConfig.color}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `${categoryConfig.label} Benchmark ${benchmarkValue}%`,
                        position: 'insideTopRight',
                        fill: categoryConfig.color,
                        fontSize: 11,
                      }}
                    />
                  ) : null;
                })()}
                
                {/* Benchmark reference line - multiple categories (total) */}
                {benchmarks && selectedCategories.size > 1 && (() => {
                  const totalBenchmark = Array.from(selectedCategories)
                    .reduce((sum, cat) => sum + benchmarks[cat], 0);
                  return totalBenchmark > 0 ? (
                    <ReferenceLine
                      yAxisId="left"
                      y={totalBenchmark}
                      stroke="#888"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `Total Benchmark ${totalBenchmark.toFixed(1)}%`,
                        position: 'insideTopRight',
                        fill: '#aaa',
                        fontSize: 11,
                      }}
                    />
                  ) : null;
                })()}
              </ComposedChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
