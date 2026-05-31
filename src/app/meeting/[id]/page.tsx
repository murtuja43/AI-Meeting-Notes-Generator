import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { AudioPlayer } from "@/components/shared/audio-player";
import { MeetingProcessor } from "@/components/meetings/meeting-processor";
import { SummaryView } from "@/components/meetings/summary-view";
import { ActionItemsView } from "@/components/meetings/action-items-view";
import { TranscriptView } from "@/components/meetings/transcript-view";
import { meetingService } from "@/server/services/meeting.service";
import { isAppError } from "@/lib/errors";
import { cn, formatDate } from "@/lib/utils";
import type { MeetingDTO } from "@/types/meeting";

// Always render fresh: the meeting may have just changed status.
export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let meeting: MeetingDTO;
  try {
    meeting = await meetingService.getMeeting(id);
  } catch (error) {
    // Missing meeting -> 404 page. Re-throw anything unexpected.
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const isCompleted = meeting.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link (styled as a ghost button via buttonVariants) */}
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header: title, status, audio player */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{meeting.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(meeting.createdAt)}
              </p>
            </div>
            <StatusBadge status={meeting.status} />
          </div>
        </CardHeader>
        <CardContent>
          <AudioPlayer src={meeting.audioUrl} />
        </CardContent>
      </Card>

      {/* Processing / retry UI for non-completed meetings. */}
      {!isCompleted && (
        <MeetingProcessor
          meetingId={meeting.id}
          status={meeting.status}
          errorMessage={meeting.errorMessage}
        />
      )}

      {/* Results — shown once processing is complete. */}
      {isCompleted && (
        <>
          <Separator />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SummaryView summary={meeting.summary} />
            <ActionItemsView items={meeting.actionItems} />
          </div>
          <TranscriptView transcript={meeting.transcript} />
        </>
      )}
    </div>
  );
}
