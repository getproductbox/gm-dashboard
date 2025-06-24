
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, CreditCard, MessageSquare, Bell } from "lucide-react";
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
    return format(new Date(dateString), 'dd/MM/yy');
  };

  return (
    <div className="space-y-3 w-full">
      {/* Contact Info - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-gm-neutral-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gm-neutral-600">Email</p>
              <p className="text-xs font-medium truncate">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-gm-neutral-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gm-neutral-600">Phone</p>
              <p className="text-xs font-medium">{customer.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats - Grid layout for space efficiency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-gm-neutral-50 rounded">
              <div className="text-sm font-bold text-gm-primary-600">
                {customer.totalBookings}
              </div>
              <div className="text-xs text-gm-neutral-600">Bookings</div>
            </div>
            <div className="text-center p-2 bg-gm-neutral-50 rounded">
              <div className="text-sm font-bold text-green-600">
                {detailedCustomer ? formatCurrency(detailedCustomer.totalSpent) : '-'}
              </div>
              <div className="text-xs text-gm-neutral-600">Spent</div>
            </div>
            <div className="text-center p-2 bg-gm-neutral-50 rounded">
              <div className="text-xs font-bold text-blue-600">
                {formatDate(customer.lastVisit)}
              </div>
              <div className="text-xs text-gm-neutral-600">Last Visit</div>
            </div>
            <div className="text-center p-2 bg-gm-neutral-50 rounded">
              <div className="text-xs font-bold text-purple-600">
                {formatDate(customer.customerSince)}
              </div>
              <div className="text-xs text-gm-neutral-600">Since</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status - Inline */}
      <Card>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Status</span>
            <Badge variant={customer.status === 'returning' ? 'default' : 'secondary'} className="text-xs">
              {customer.status === 'returning' ? 'Returning' : 'First-time'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preferences - Compact switches */}
      {detailedCustomer && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-consent" className="text-xs">Email Marketing</Label>
              <Switch
                id="email-consent"
                checked={detailedCustomer.emailConsent}
                disabled
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-consent" className="text-xs">SMS Marketing</Label>
              <Switch
                id="sms-consent"
                checked={detailedCustomer.smsConsent}
                disabled
                className="scale-75"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes - If present */}
      {detailedCustomer?.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gm-neutral-600 leading-relaxed">
              {detailedCustomer.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
