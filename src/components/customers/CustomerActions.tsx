
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
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-2">
          <Button 
            onClick={onCreateBooking}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Create New Booking
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={onSendEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onEditCustomer}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Customer
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onViewAllBookings}
            className="w-full flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            View All Bookings
          </Button>
        </div>

        <Separator />

        {/* Secondary Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gm-neutral-700 mb-2">
            Advanced Actions
          </h4>
          
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              onClick={onMergeDuplicate}
              className="w-full justify-start text-sm"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Merge Duplicate Customer
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onArchiveCustomer}
              className="w-full justify-start text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              size="sm"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Customer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
