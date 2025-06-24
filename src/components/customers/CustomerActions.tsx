
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Mail, Eye, Archive, Users, Calendar, Edit } from "lucide-react";

interface CustomerActionsProps {
  onCreateBooking: () => void;
  onSendEmail: () => void;
  onEditCustomer: () => void;
  onArchiveCustomer: () => void;
  onMergeDuplicate: () => void;
  onViewAllBookings: () => void;
}

export const CustomerActions = ({
  onCreateBooking,
  onSendEmail,
  onEditCustomer,
  onArchiveCustomer,
  onMergeDuplicate,
  onViewAllBookings
}: CustomerActionsProps) => {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Primary Actions */}
        <div className="space-y-2">
          <Button 
            onClick={onCreateBooking}
            className="w-full flex items-center gap-2 text-sm sm:text-base"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create New Booking</span>
            <span className="sm:hidden">New Booking</span>
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={onSendEmail}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Send Email</span>
              <span className="sm:hidden">Email</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onEditCustomer}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Edit Customer</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onViewAllBookings}
            className="w-full flex items-center gap-2 text-xs sm:text-sm"
            size="sm"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">View All Bookings</span>
            <span className="sm:hidden">All Bookings</span>
          </Button>
        </div>

        <Separator />

        {/* Secondary Actions */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-gm-neutral-700 mb-2">
            Advanced Actions
          </h4>
          
          <div className="space-y-1 sm:space-y-2">
            <Button 
              variant="ghost" 
              onClick={onMergeDuplicate}
              className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">Merge Duplicate Customer</span>
              <span className="sm:hidden">Merge Duplicate</span>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onArchiveCustomer}
              className="w-full justify-start text-xs sm:text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 sm:h-9"
            >
              <Archive className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">Archive Customer</span>
              <span className="sm:hidden">Archive</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
