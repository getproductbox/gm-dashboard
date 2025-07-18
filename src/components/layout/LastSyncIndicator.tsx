import { Clock } from "lucide-react";
import { useLastSyncTime } from "@/hooks/useLastSyncTime";
import { useSidebar } from "@/components/ui/sidebar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export function LastSyncIndicator() {
  const { lastSyncFormatted, isLoading } = useLastSyncTime();
  const { state } = useSidebar();

  const syncText = isLoading ? "Loading..." : `Last synced: ${lastSyncFormatted}`;

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {syncText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>{syncText}</span>
    </div>
  );
}