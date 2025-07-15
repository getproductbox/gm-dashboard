import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProfitLossSummary, ProfitLossComparison } from '@/hooks/useProfitLoss';
import { 
  formatCurrency, 
  formatPercentage, 
  formatChangeIndicator,
  getCategoryDisplayName,
  getSubcategoryDisplayName,
  groupAccountsByCategory,
  getProfitLossColors
} from '@/utils/profitLossUtils';

interface ProfitLossTableProps {
  data: ProfitLossSummary;
  comparisonData?: ProfitLossComparison;
  showComparison?: boolean;
}

export const ProfitLossTable = ({ data, comparisonData, showComparison = false }: ProfitLossTableProps) => {
  const colors = getProfitLossColors();
  const groupedAccounts = groupAccountsByCategory(data.accounts);

  const renderChangeIndicator = (currentValue: number, previousValue: number, isAmount = true) => {
    if (!showComparison || !comparisonData) return null;
    
    const change = currentValue - previousValue;
    const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
    const indicator = formatChangeIndicator(isAmount ? change : changePercentage, !isAmount);
    
    return (
      <div className={`text-xs ${indicator.color} flex items-center`}>
        {indicator.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {indicator.value}
      </div>
    );
  };

  const renderSummaryRow = (
    label: string,
    amount: number,
    previousAmount?: number,
    className = '',
    isBold = false
  ) => (
    <TableRow className={className}>
      <TableCell className={isBold ? 'font-semibold' : ''}>{label}</TableCell>
      <TableCell className={`text-right ${isBold ? 'font-semibold' : ''}`}>
        {formatCurrency(amount)}
      </TableCell>
      {showComparison && (
        <TableCell className="text-right">
          {previousAmount !== undefined ? renderChangeIndicator(amount, previousAmount) : null}
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profit & Loss Statement</span>
          <Badge variant="outline">
            {data.period_start} to {data.period_end}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {showComparison && <TableHead className="text-right">Change</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Revenue Section */}
            <TableRow className="bg-green-50">
              <TableCell colSpan={showComparison ? 3 : 2} className="font-semibold text-green-800">
                REVENUE
              </TableCell>
            </TableRow>
            
            {groupedAccounts.revenue?.map((account, idx) => (
              <TableRow key={`revenue-${account.account_name}-${idx}`}>
                <TableCell className="pl-6">
                  <div>
                    <div className="font-medium">{account.account_name}</div>
                    <div className="text-xs text-gm-neutral-500">
                      {getSubcategoryDisplayName(account.subcategory)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(account.amount_cents)}
                </TableCell>
                {showComparison && <TableCell></TableCell>}
              </TableRow>
            ))}
            
            {renderSummaryRow(
              'Total Revenue',
              data.total_revenue_cents,
              comparisonData?.previous.total_revenue_cents,
              'border-t bg-green-100',
              true
            )}

            {/* Cost of Sales Section */}
            {groupedAccounts.cost_of_sales && groupedAccounts.cost_of_sales.length > 0 && (
              <>
                <TableRow className="bg-orange-50">
                  <TableCell colSpan={showComparison ? 3 : 2} className="font-semibold text-orange-800">
                    COST OF SALES
                  </TableCell>
                </TableRow>
                
                {groupedAccounts.cost_of_sales.map((account, idx) => (
                  <TableRow key={`cost-${account.account_name}-${idx}`}>
                    <TableCell className="pl-6">
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        <div className="text-xs text-gm-neutral-500">
                          {getSubcategoryDisplayName(account.subcategory)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.amount_cents)}
                    </TableCell>
                    {showComparison && <TableCell></TableCell>}
                  </TableRow>
                ))}
                
                {renderSummaryRow(
                  'Total Cost of Sales',
                  data.cost_of_sales_cents,
                  comparisonData?.previous.cost_of_sales_cents,
                  'border-t bg-orange-100',
                  true
                )}
              </>
            )}

            {/* Gross Profit */}
            {renderSummaryRow(
              'Gross Profit',
              data.gross_profit_cents,
              comparisonData?.previous.gross_profit_cents,
              'border-t-2 border-blue-200 bg-blue-50',
              true
            )}

            <TableRow>
              <TableCell className="pl-6 text-sm text-gm-neutral-600">
                Gross Margin: {formatPercentage(data.gross_margin_percentage)}
              </TableCell>
              <TableCell></TableCell>
              {showComparison && <TableCell></TableCell>}
            </TableRow>

            {/* Operating Expenses Section */}
            {groupedAccounts.operating_expenses && groupedAccounts.operating_expenses.length > 0 && (
              <>
                <TableRow className="bg-red-50">
                  <TableCell colSpan={showComparison ? 3 : 2} className="font-semibold text-red-800">
                    OPERATING EXPENSES
                  </TableCell>
                </TableRow>
                
                {groupedAccounts.operating_expenses.map((account, idx) => (
                  <TableRow key={`expense-${account.account_name}-${idx}`}>
                    <TableCell className="pl-6">
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        <div className="text-xs text-gm-neutral-500">
                          {getSubcategoryDisplayName(account.subcategory)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.amount_cents)}
                    </TableCell>
                    {showComparison && <TableCell></TableCell>}
                  </TableRow>
                ))}
                
                {renderSummaryRow(
                  'Total Operating Expenses',
                  data.operating_expenses_cents,
                  comparisonData?.previous.operating_expenses_cents,
                  'border-t bg-red-100',
                  true
                )}
              </>
            )}

            {/* Net Profit */}
            {renderSummaryRow(
              'Net Profit',
              data.net_profit_cents,
              comparisonData?.previous.net_profit_cents,
              `border-t-4 ${data.net_profit_cents >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`,
              true
            )}

            <TableRow>
              <TableCell className="pl-6 text-sm text-gm-neutral-600">
                Net Margin: {formatPercentage(data.net_margin_percentage)}
              </TableCell>
              <TableCell></TableCell>
              {showComparison && <TableCell></TableCell>}
            </TableRow>
          </TableBody>
        </Table>

        {/* Summary Cards */}
        {showComparison && comparisonData && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gm-neutral-600">Revenue Change</div>
                  <div className={`text-lg font-semibold ${comparisonData.changes.revenue_change_cents >= 0 ? colors.positive : colors.negative}`}>
                    {formatCurrency(comparisonData.changes.revenue_change_cents)}
                  </div>
                  <div className="text-xs text-gm-neutral-500">
                    {formatPercentage(comparisonData.changes.revenue_change_percentage)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gm-neutral-600">Gross Profit Change</div>
                  <div className={`text-lg font-semibold ${comparisonData.changes.gross_profit_change_cents >= 0 ? colors.positive : colors.negative}`}>
                    {formatCurrency(comparisonData.changes.gross_profit_change_cents)}
                  </div>
                  <div className="text-xs text-gm-neutral-500">
                    {formatPercentage(comparisonData.changes.gross_profit_change_percentage)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gm-neutral-600">Net Profit Change</div>
                  <div className={`text-lg font-semibold ${comparisonData.changes.net_profit_change_cents >= 0 ? colors.positive : colors.negative}`}>
                    {formatCurrency(comparisonData.changes.net_profit_change_cents)}
                  </div>
                  <div className="text-xs text-gm-neutral-500">
                    {formatPercentage(comparisonData.changes.net_profit_change_percentage)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};