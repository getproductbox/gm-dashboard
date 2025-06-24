
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Primary Actions - Compact */}
        <div className="space-y-1">
          <Button 
            onClick={onCreateBooking}
            className="w-full h-8 text-xs"
            size="sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Booking
          </Button>
          
          <div className="grid grid-cols-2 gap-1">
            <Button 
              variant="outline" 
              onClick={onSendEmail}
              className="h-7 text-xs"
              size="sm"
            >
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onEditCustomer}
              className="h-7 text-xs"
              size="sm"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onViewAllBookings}
            className="w-full h-7 text-xs"
            size="sm"
          >
            <Calendar className="h-3 w-3 mr-1" />
            All Bookings
          </Button>
        </div>

        <Separator className="my-2" />

        {/* Secondary Actions - More compact */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-gm-neutral-700 mb-1">
            Advanced
          </h4>
          
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              onClick={onMergeDuplicate}
              className="w-full justify-start text-xs h-6 px-2"
            >
              <Users className="h-3 w-3 mr-1" />
              Merge Duplicate
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onArchiveCustomer}
              className="w-full justify-start text-xs h-6 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <Archive className="h-3 w-3 mr-1" />
              Archive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
