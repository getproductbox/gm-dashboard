
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'cancelled';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          className: 'bg-gm-success-50 text-gm-success-700 border-gm-success-200'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-gm-warning-50 text-gm-warning-700 border-gm-warning-200'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-gm-neutral-100 text-gm-neutral-600 border-gm-neutral-300'
        };
      default:
        return {
          label: status,
          className: 'bg-gm-neutral-100 text-gm-neutral-600 border-gm-neutral-300'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
