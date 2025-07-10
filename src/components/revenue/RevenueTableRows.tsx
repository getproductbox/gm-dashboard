import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { RevenueRow } from './types';
import { formatCurrency, formatPercent, getPercentColor } from './utils';

interface RevenueTableRowsProps {
  data: RevenueRow[];
}

export const RevenueTableRows = ({ data }: RevenueTableRowsProps) => {
  return (
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.period}>
          <TableCell className="font-medium">{row.period}</TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(row.totalDollars)}
          </TableCell>
          <TableCell className={cn("text-right font-mono", getPercentColor(row.totalPercent))}>
            {formatPercent(row.totalPercent)}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(row.barDollars)}
          </TableCell>
          <TableCell className={cn("text-right font-mono", getPercentColor(row.barPercent))}>
            {formatPercent(row.barPercent)}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(row.doorDollars)}
          </TableCell>
          <TableCell className={cn("text-right font-mono", getPercentColor(row.doorPercent))}>
            {formatPercent(row.doorPercent)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};