import { Clock } from "lucide-react";
import { useLastSyncTime } from "@/hooks/useLastSyncTime";

export function LastSyncIndicator() {
  const { lastSyncFormatted, isLoading } = useLastSyncTime();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>Last synced: {lastSyncFormatted}</span>
    </div>
  );
}