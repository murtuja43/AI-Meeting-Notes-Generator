import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import type { MeetingListItemDTO } from "@/types/meeting";

/** A single meeting in the dashboard history grid. Links to the detail page. */
export function MeetingCard({ meeting }: { meeting: MeetingListItemDTO }) {
  return (
    <Link href={`/meeting/${meeting.id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">
              {meeting.title}
            </CardTitle>
            <StatusBadge status={meeting.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(meeting.createdAt)}
          </p>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {meeting.summary ??
              (meeting.status === "FAILED"
                ? "Processing failed — open to retry."
                : "Awaiting transcription & summary…")}
          </p>
        </CardContent>
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            {meeting.actionItemCount} action item
            {meeting.actionItemCount === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1 font-medium text-foreground/70 transition-colors group-hover:text-foreground">
            View
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
