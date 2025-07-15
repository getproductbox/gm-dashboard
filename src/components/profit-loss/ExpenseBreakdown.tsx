import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ProfitLossSummary } from '@/hooks/useProfitLoss';
import { 
  formatCurrency, 
  formatPercentage,
  groupAccountsBySubcategory,
  getSubcategoryDisplayName,
  sortAccountsByAmount
} from '@/utils/profitLossUtils';

interface ExpenseBreakdownProps {
  data: ProfitLossSummary;
}

export const ExpenseBreakdown = ({ data }: ExpenseBreakdownProps) => {
  const operatingExpenses = data.accounts.filter(account => account.category === 'operating_expenses');
  const expensesBySubcategory = groupAccountsBySubcategory(operatingExpenses);
  
  // Prepare data for charts
  const expenseChartData = Object.entries(expensesBySubcategory)
    .map(([subcategory, data]) => ({
      name: getSubcategoryDisplayName(subcategory),
      value: data.total_cents,
      percentage: data.total_cents > 0 ? (data.total_cents / operatingExpenses.reduce((sum, acc) => sum + acc.amount_cents, 0)) * 100 : 0,
      accounts: data.accounts.length
    }))
    .sort((a, b) => b.value - a.value);

  const revenueVsExpenseData = [
    {
      name: 'Revenue vs Expenses',
      revenue: data.total_revenue_cents,
      operating_expenses: data.operating_expenses_cents,
      cost_of_sales: data.cost_of_sales_cents,
      net_profit: data.net_profit_cents
    }
  ];

  // Colors for pie chart
  const COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500  
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#6b7280'  // gray-500
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const expenseToRevenueRatio = data.total_revenue_cents > 0 
    ? (data.operating_expenses_cents / data.total_revenue_cents) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data.operating_expenses_cents)}
              </div>
              <div className="text-sm text-gm-neutral-600">Total Operating Expenses</div>
              <div className="text-xs text-gm-neutral-500 mt-1">
                {formatPercentage(expenseToRevenueRatio)} of revenue
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(expensesBySubcategory).length}
              </div>
              <div className="text-sm text-gm-neutral-600">Expense Categories</div>
              <div className="text-xs text-gm-neutral-500 mt-1">
                {operatingExpenses.length} total accounts
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(data.net_margin_percentage)}
              </div>
              <div className="text-sm text-gm-neutral-600">Net Profit Margin</div>
              <div className="text-xs text-gm-neutral-500 mt-1">
                After all expenses
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${formatPercentage(percentage)}`}
                    labelLine={false}
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueVsExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" hide />
                  <YAxis tickFormatter={(value) => `$${(value / 100).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                  <Bar dataKey="cost_of_sales" fill="#f97316" name="Cost of Sales" />
                  <Bar dataKey="operating_expenses" fill="#ef4444" name="Operating Expenses" />
                  <Bar dataKey="net_profit" fill="#3b82f6" name="Net Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(expensesBySubcategory)
              .sort(([,a], [,b]) => b.total_cents - a.total_cents)
              .map(([subcategory, categoryData]) => {
                const percentage = data.operating_expenses_cents > 0 
                  ? (categoryData.total_cents / data.operating_expenses_cents) * 100 
                  : 0;
                
                return (
                  <div key={subcategory} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getSubcategoryDisplayName(subcategory)}</span>
                        <Badge variant="outline">{categoryData.accounts.length} accounts</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(categoryData.total_cents)}</div>
                        <div className="text-xs text-gm-neutral-500">
                          {formatPercentage(percentage)} of expenses
                        </div>
                      </div>
                    </div>
                    
                    <Progress value={percentage} className="h-2" />
                    
                    {/* Individual accounts in this category */}
                    <div className="ml-4 space-y-1">
                      {sortAccountsByAmount(categoryData.accounts).slice(0, 3).map((account, idx) => (
                        <div key={`${account.account_name}-${idx}`} className="flex justify-between text-sm text-gm-neutral-600">
                          <span>{account.account_name}</span>
                          <span>{formatCurrency(account.amount_cents)}</span>
                        </div>
                      ))}
                      {categoryData.accounts.length > 3 && (
                        <div className="text-xs text-gm-neutral-500">
                          +{categoryData.accounts.length - 3} more accounts
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Expense Ratios</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Operating Expenses to Revenue:</span>
                  <span className="font-medium">{formatPercentage(expenseToRevenueRatio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cost of Sales to Revenue:</span>
                  <span className="font-medium">
                    {formatPercentage(data.total_revenue_cents > 0 ? (data.cost_of_sales_cents / data.total_revenue_cents) * 100 : 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Costs to Revenue:</span>
                  <span className="font-medium">
                    {formatPercentage(data.total_revenue_cents > 0 ? ((data.cost_of_sales_cents + data.operating_expenses_cents) / data.total_revenue_cents) * 100 : 0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Top Expense Categories</h4>
              <div className="space-y-2">
                {expenseChartData.slice(0, 3).map((category, index) => (
                  <div key={category.name} className="flex justify-between">
                    <span className="text-sm">{category.name}:</span>
                    <span className="font-medium">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};