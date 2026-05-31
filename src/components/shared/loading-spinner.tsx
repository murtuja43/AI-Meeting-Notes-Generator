import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small reusable spinner with an optional label. */
export function LoadingSpinner({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
