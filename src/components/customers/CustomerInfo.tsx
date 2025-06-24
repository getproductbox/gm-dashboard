
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Calendar, CreditCard, MessageSquare, Bell, Shield } from "lucide-react";
import { Customer, DetailedCustomer } from "@/data/mockData/customers";
import { format } from "date-fns";

interface CustomerInfoProps {
  customer: Customer | DetailedCustomer;
}

export const CustomerInfo = ({ customer }: CustomerInfoProps) => {
  const isDetailedCustomer = (cust: Customer | DetailedCustomer): cust is DetailedCustomer => {
    return 'totalSpent' in cust;
  };

  const detailedCustomer = isDetailedCustomer(customer) ? customer : null;

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
    <div className="space-y-3 sm:space-y-4">
      {/* Basic Info Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Mail className="h-4 w-4 text-gm-neutral-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gm-neutral-600">Email</p>
                <p className="text-sm sm:text-base font-medium truncate">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Phone className="h-4 w-4 text-gm-neutral-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gm-neutral-600">Phone</p>
                <p className="text-sm sm:text-base font-medium">{customer.phone}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            Customer Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-gm-primary-600">
                {customer.totalBookings}
              </div>
              <div className="text-xs sm:text-sm text-gm-neutral-600">
                <span className="hidden sm:inline">Total Bookings</span>
                <span className="sm:hidden">Bookings</span>
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                {detailedCustomer ? formatCurrency(detailedCustomer.totalSpent) : '-'}
              </div>
              <div className="text-xs sm:text-sm text-gm-neutral-600">
                <span className="hidden sm:inline">Total Spent</span>
                <span className="sm:hidden">Spent</span>
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-sm sm:text-base font-bold text-blue-600">
                {formatDate(customer.lastVisit)}
              </div>
              <div className="text-xs sm:text-sm text-gm-neutral-600">Last Visit</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gm-neutral-50 rounded-lg">
              <div className="text-sm sm:text-base font-bold text-purple-600">
                {formatDate(customer.customerSince)}
              </div>
              <div className="text-xs sm:text-sm text-gm-neutral-600">
                <span className="hidden sm:inline">Customer Since</span>
                <span className="sm:hidden">Since</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Status */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-medium">Status</span>
            <Badge variant={customer.status === 'returning' ? 'default' : 'secondary'}>
              {customer.status === 'returning' ? 'Returning Customer' : 'First-time Customer'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preferences (only for detailed customers) */}
      {detailedCustomer && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-consent" className="text-sm sm:text-base">Email Marketing</Label>
              <Switch
                id="email-consent"
                checked={detailedCustomer.emailConsent}
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-consent" className="text-sm sm:text-base">SMS Marketing</Label>
              <Switch
                id="sms-consent"
                checked={detailedCustomer.smsConsent}
                disabled
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes (only for detailed customers) */}
      {detailedCustomer?.notes && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-gm-neutral-600 leading-relaxed">
              {detailedCustomer.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
