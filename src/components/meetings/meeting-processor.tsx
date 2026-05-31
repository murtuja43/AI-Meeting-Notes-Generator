"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type { ApiResponse } from "@/lib/api-response";
import type { MeetingDTO, MeetingStatus } from "@/types/meeting";

/**
 * Client component that drives the AI pipeline for a meeting.
 *
 * - For a PENDING meeting it auto-starts processing on mount (the user just
 *   uploaded and expects it to "just work").
 * - For a FAILED meeting it shows a Retry button instead of auto-running, so a
 *   broken file doesn't loop.
 * - On completion it calls `router.refresh()` so the server component re-renders
 *   with the finished transcript/summary/action items.
 */
export function MeetingProcessor({
  meetingId,
  status,
  errorMessage,
}: {
  meetingId: string;
  status: MeetingStatus;
  errorMessage: string | null;
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage);
  // Guard so React Strict Mode's double-mount doesn't fire two AI calls.
  const startedRef = useRef(false);

  const runProcessing = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/process`, {
        method: "POST",
      });
      const json = (await res.json()) as ApiResponse<MeetingDTO>;
      if (!json.success) {
        setError(json.error.message);
        return;
      }
      // Re-fetch the server component with completed data.
      router.refresh();
    } catch {
      setError("Processing request failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [meetingId, router]);

  // Auto-start for freshly-uploaded (PENDING) meetings.
  useEffect(() => {
    if (status === "PENDING" && !startedRef.current) {
      startedRef.current = true;
      void runProcessing();
    }
  }, [status, runProcessing]);

  // Active processing (either we just started, or status came in as PROCESSING).
  if (isProcessing || status === "PROCESSING") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Sparkles className="h-8 w-8 animate-pulse text-primary" />
          <div>
            <p className="font-medium">Generating your meeting notes…</p>
            <p className="text-sm text-muted-foreground">
              Transcribing the audio and extracting a summary &amp; action items.
              This can take a minute.
            </p>
          </div>
          <LoadingSpinner label="Working…" />
        </CardContent>
      </Card>
    );
  }

  // Failed: offer a retry.
  if (status === "FAILED") {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium">Processing failed</p>
            <p className="text-sm text-muted-foreground">
              {error ?? "Something went wrong while generating the notes."}
            </p>
          </div>
          <Button onClick={() => void runProcessing()} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // PENDING (before the auto-start effect kicks in) — render a tiny placeholder.
  return null;
}
