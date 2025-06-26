
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';

interface RevenueEvent {
  id: string;
  square_payment_id: string;
  venue: string;
  revenue_type: 'bar' | 'door' | 'other';
  amount_cents: number;
  currency: string;
  payment_date: string;
  payment_hour: number;
  payment_day_of_week: number;
  status: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

interface RevenueTableProps {
  data: RevenueEvent[];
}

export const RevenueTable = ({ data }: RevenueTableProps) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getRevenueTypeBadge = (type: string) => {
    const variants = {
      bar: 'default',
      door: 'secondary',
      other: 'outline'
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Square ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No revenue data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(event.payment_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(event.payment_date), 'h:mm a')}
                    </TableCell>
                    <TableCell>
                      {getRevenueTypeBadge(event.revenue_type)}
                    </TableCell>
                    <TableCell>{event.venue}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(event.amount_cents)}
                    </TableCell>
                    <TableCell>
                      {getDayName(event.payment_day_of_week)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'completed' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.square_payment_id.substring(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
