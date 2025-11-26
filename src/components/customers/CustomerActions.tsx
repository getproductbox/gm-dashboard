
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Archive } from "lucide-react";

interface CustomerActionsProps {
  onCreateBooking: () => void;
  onArchiveCustomer: () => void;
}

export const CustomerActions = ({
  onCreateBooking,
  onArchiveCustomer
}: CustomerActionsProps) => {
  return null; // No longer needed since actions are moved to top
};
