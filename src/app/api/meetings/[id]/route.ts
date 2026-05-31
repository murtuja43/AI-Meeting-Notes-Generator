import { meetingService } from "@/server/services/meeting.service";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * GET /api/meetings/:id
 * Returns a single meeting with all artifacts.
 *
 * In Next.js 15 the `params` object is a Promise and must be awaited.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const meeting = await meetingService.getMeeting(id);
    return ok(meeting);
  } catch (error) {
    return fail(error);
  }
}
