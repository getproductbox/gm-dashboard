
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Calendar, DollarSign, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface CustomerInfoProps {
  customer: any;
}

export const CustomerInfo = ({ customer }: CustomerInfoProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-4">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gm-neutral-500" />
            <span className="text-sm text-gm-neutral-700">{customer.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gm-neutral-500" />
            <span className="text-sm text-gm-neutral-700">{customer.phone}</span>
          </div>
        </CardContent>
      </Card>

      {/* Customer Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-gm-primary-600">{customer.totalBookings}</div>
              <div className="text-sm text-gm-neutral-600">Total Bookings</div>
            </div>
            <div className="text-center p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(customer.totalSpent || customer.totalBookings * 85)}
              </div>
              <div className="text-sm text-gm-neutral-600">Total Spent</div>
            </div>
            <div className="text-center p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-sm font-medium text-gm-neutral-900">
                {formatDate(customer.customerSince)}
              </div>
              <div className="text-sm text-gm-neutral-600">Customer Since</div>
            </div>
            <div className="text-center p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-sm font-medium text-gm-neutral-900">
                {formatDate(customer.lastVisit)}
              </div>
              <div className="text-sm text-gm-neutral-600">Last Visit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-marketing" className="text-sm font-medium">
              Email Marketing
            </Label>
            <Switch 
              id="email-marketing" 
              defaultChecked={customer.emailConsent !== false}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-marketing" className="text-sm font-medium">
              SMS Marketing
            </Label>
            <Switch 
              id="sms-marketing" 
              defaultChecked={customer.smsConsent !== false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Staff Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about this customer..."
            defaultValue={customer.notes || ""}
            className="min-h-20 resize-none"
            readOnly
          />
        </CardContent>
      </Card>

      {/* Customer Insights */}
      {customer.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gm-neutral-600">Favorite Service:</span>
              <Badge variant="outline">{customer.insights.favoriteService}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gm-neutral-600">Average Booking:</span>
              <span className="text-sm font-medium">
                {formatCurrency(customer.insights.averageBookingValue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gm-neutral-600">Preferred Time:</span>
              <span className="text-sm font-medium">{customer.insights.preferredTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gm-neutral-600">Booking Pattern:</span>
              <span className="text-sm font-medium">{customer.insights.bookingPattern}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
