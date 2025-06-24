
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  breakdown?: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export const MetricCard = ({ title, value, icon: Icon, change, breakdown }: MetricCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gm-neutral-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gm-neutral-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gm-neutral-900">
          {typeof value === 'number' && title.includes('Revenue') 
            ? `$${value.toFixed(2)}` 
            : value}
        </div>
        
        {change !== undefined && (
          <p className={`text-xs flex items-center mt-1 ${
            change >= 0 ? 'text-gm-success-700' : 'text-gm-error-700'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs yesterday
          </p>
        )}
        
        {breakdown && (
          <div className="mt-3 space-y-1">
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <div 
                    className={`w-2 h-2 rounded-full mr-2`}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gm-neutral-600">{item.label}</span>
                </div>
                <span className="font-medium text-gm-neutral-900">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
