
import { BookingRow } from "@/services/bookingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Calendar, Users } from "lucide-react";

interface OperationalForecastProps {
  bookings: BookingRow[];
  utilization: number;
  isLoading: boolean;
}

export function OperationalForecast({ bookings, utilization, isLoading }: OperationalForecastProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 animate-pulse">
          <CardHeader><div className="h-6 w-32 bg-gray-200 rounded"></div></CardHeader>
          <CardContent><div className="h-32 bg-gray-200 rounded"></div></CardContent>
        </Card>
        <Card className="lg:col-span-2 animate-pulse">
          <CardHeader><div className="h-6 w-32 bg-gray-200 rounded"></div></CardHeader>
          <CardContent><div className="h-32 bg-gray-200 rounded"></div></CardContent>
        </Card>
      </div>
    );
  }

  const getVenueBadge = (venue: string) => {
    switch (venue) {
      case 'manor': return <Badge variant="default" className="bg-purple-600">Manor</Badge>;
      case 'hippie': return <Badge variant="secondary" className="bg-orange-500 text-white">Hippie</Badge>;
      default: return <Badge variant="outline">{venue}</Badge>;
    }
  };

  // Utilization color
  const utilColor = utilization > 80 ? "bg-green-600" : utilization > 50 ? "bg-blue-600" : "bg-yellow-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Utilization Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Karaoke Utilization
          </CardTitle>
          <p className="text-sm text-muted-foreground">Next 7 Days Capacity</p>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center py-8 space-y-4">
          <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-gray-100">
            {/* Simple circular representation or just a big number */}
            <div className="text-center">
              <span className="text-4xl font-bold">{Math.round(utilization)}%</span>
              <p className="text-xs text-muted-foreground">Booked</p>
            </div>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>0%</span>
              <span>100%</span>
            </div>
            <Progress value={utilization} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Upcoming Bookings
          </CardTitle>
          <p className="text-sm text-muted-foreground">Next 7 Days</p>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No upcoming bookings found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Guests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(booking.booking_date), "MMM d")}
                      <span className="block text-xs text-muted-foreground">
                        {booking.start_time?.slice(0, 5)}
                      </span>
                    </TableCell>
                    <TableCell>{booking.customer_name}</TableCell>
                    <TableCell>{getVenueBadge(booking.venue)}</TableCell>
                    <TableCell className="capitalize text-sm">
                      {booking.booking_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-right">{booking.guest_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

