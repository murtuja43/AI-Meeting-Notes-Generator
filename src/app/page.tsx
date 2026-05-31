import { AlertCircle } from "lucide-react";
import { AudioUploader } from "@/components/upload/audio-uploader";
import { MeetingList } from "@/components/meetings/meeting-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { meetingService } from "@/server/services/meeting.service";
import type { MeetingListItemDTO } from "@/types/meeting";

// The dashboard reads from the database on every request and must never be
// statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Server Component: read the meeting history directly from the service layer
  // (no client-side fetch needed). Guard the DB call so a connection problem
  // shows a friendly message instead of crashing the whole page.
  let meetings: MeetingListItemDTO[] = [];
  let loadError = false;
  try {
    meetings = await meetingService.listMeetings();
  } catch (error) {
    console.error("[dashboard] Failed to load meetings:", error);
    loadError = true;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Hero / intro */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Turn meeting audio into action
        </h1>
        <p className="text-muted-foreground">
          Upload a recording and get an AI-generated transcript, summary and
          action items in minutes.
        </p>
      </section>

      {/* Upload */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Upload a meeting</CardTitle>
            <CardDescription>
              Supported formats: mp3, m4a, wav, webm, ogg (max 25MB).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AudioUploader />
          </CardContent>
        </Card>
      </section>

      {/* History */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Meeting history</h2>
        {loadError ? (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Couldn&apos;t load your meetings. Check that your database is
              running and <code>DATABASE_URL</code> is set correctly.
            </span>
          </div>
        ) : (
          <MeetingList meetings={meetings} />
        )}
      </section>
    </div>
  );
}
