import { ScrollText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

/** Renders the full Whisper transcript in a scrollable area, or an empty state. */
export function TranscriptView({ transcript }: { transcript: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          Transcript
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transcript ? (
          <div className="max-h-96 overflow-y-auto rounded-md bg-muted/40 p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {transcript}
            </p>
          </div>
        ) : (
          <EmptyState
            icon={ScrollText}
            title="No transcript yet"
            description="The transcript will appear here once the audio is processed."
          />
        )}
      </CardContent>
    </Card>
  );
}
