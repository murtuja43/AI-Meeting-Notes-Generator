import { meetingService } from "@/server/services/meeting.service";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Whisper + GPT can take a while; allow up to 5 minutes on platforms that honor
// this (e.g. Vercel). Default would otherwise cut long transcriptions short.
export const maxDuration = 300;

/**
 * POST /api/meetings/:id/process
 * Runs the AI pipeline (Whisper transcription -> GPT summary + action items)
 * and returns the fully-processed meeting.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const meeting = await meetingService.processMeeting(id);
    return ok(meeting);
  } catch (error) {
    return fail(error);
  }
}
