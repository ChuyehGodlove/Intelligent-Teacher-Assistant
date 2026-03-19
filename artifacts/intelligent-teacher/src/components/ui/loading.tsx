import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium animate-pulse">Loading data...</p>
    </div>
  );
}
