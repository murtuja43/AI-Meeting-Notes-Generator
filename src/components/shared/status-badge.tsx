import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/types/meeting";

/**
 * Maps a meeting's lifecycle status to a coloured badge with icon + label.
 * Centralizing this means status is rendered consistently everywhere.
 */
const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; variant: BadgeProps["variant"]; icon: typeof Clock; spin?: boolean }
> = {
  PENDING: { label: "Pending", variant: "secondary", icon: Clock },
  PROCESSING: { label: "Processing", variant: "warning", icon: Loader2, spin: true },
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  FAILED: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={cn("h-3 w-3", config.spin && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
