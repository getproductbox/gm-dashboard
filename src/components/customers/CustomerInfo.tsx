
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Calendar, CreditCard, MessageSquare } from "lucide-react";
import { Customer, DetailedCustomer } from "@/data/mockData/customers";
import { format } from "date-fns";

interface CustomerInfoProps {
  customer: Customer | DetailedCustomer;
}

export const CustomerInfo = ({ customer }: CustomerInfoProps) => {
  const isDetailedCustomer = (customer: Customer | DetailedCustomer): customer is DetailedCustomer => {
    return 'totalSpent' in customer;
  };

  const detailed = isDetailedCustomer(customer) ? customer : null;

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
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gm-neutral-500" />
              <div>
                <p className="text-sm text-gm-neutral-600">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gm-neutral-500" />
              <div>
                <p className="text-sm text-gm-neutral-600">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gm-neutral-500" />
              <div>
                <p className="text-sm text-gm-neutral-600">Customer Since</p>
                <p className="font-medium">{formatDate(customer.customerSince)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gm-neutral-500" />
              <div>
                <p className="text-sm text-gm-neutral-600">Last Visit</p>
                <p className="font-medium">{formatDate(customer.lastVisit)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gm-neutral-600">Status:</span>
            <Badge variant={customer.status === 'returning' ? 'default' : 'secondary'}>
              {customer.status === 'returning' ? 'Returning Customer' : 'First Time'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats - only show if detailed customer data available */}
      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Customer Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gm-primary-600">
                  {customer.totalBookings}
                </div>
                <div className="text-xs text-gm-neutral-600">Total Bookings</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(detailed.totalSpent)}
                </div>
                <div className="text-xs text-gm-neutral-600">Total Spent</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(detailed.insights.averageBookingValue)}
                </div>
                <div className="text-xs text-gm-neutral-600">Avg. Booking</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {detailed.insights.favoriteService}
                </div>
                <div className="text-xs text-gm-neutral-600">Favorite Service</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences & Notes */}
      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Preferences & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gm-neutral-700">Marketing Preferences</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${detailed.emailConsent ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">Email: {detailed.emailConsent ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${detailed.smsConsent ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">SMS: {detailed.smsConsent ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gm-neutral-700">Customer Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gm-neutral-600">Preferred Time: </span>
                  <span className="font-medium">{detailed.insights.preferredTime}</span>
                </div>
                <div>
                  <span className="text-gm-neutral-600">Booking Pattern: </span>
                  <span className="font-medium">{detailed.insights.bookingPattern}</span>
                </div>
              </div>
            </div>
            
            {detailed.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gm-neutral-700">Notes</h4>
                  <p className="text-sm text-gm-neutral-600 bg-gm-neutral-50 p-3 rounded-lg">
                    {detailed.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
