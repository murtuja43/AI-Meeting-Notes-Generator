import type { NextRequest } from "next/server";
import { meetingService } from "@/server/services/meeting.service";
import { ok, fail } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import {
  createMeetingSchema,
  validateAudioFile,
} from "@/schemas/meeting.schema";

/**
 * This route handles audio uploads, which require the Node.js runtime
 * (Buffer + Cloudinary streaming). Force it off the Edge runtime.
 */
export const runtime = "nodejs";
// Uploads must never be cached and always run per-request.
export const dynamic = "force-dynamic";

/**
 * GET /api/meetings
 * Returns the meeting history (lightweight list items).
 */
export async function GET() {
  try {
    const meetings = await meetingService.listMeetings();
    return ok(meetings);
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/meetings
 * Accepts a multipart form (title + audio file), stores the audio and creates a
 * PENDING meeting. Returns the created meeting so the client can immediately
 * trigger processing.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate text fields with Zod.
    const { title } = createMeetingSchema.parse({
      title: formData.get("title"),
    });

    // Validate the audio file separately.
    const audioValidation = validateAudioFile(formData.get("audio"));
    if (!audioValidation.ok) {
      throw AppError.badRequest(audioValidation.error);
    }
    const file = audioValidation.file;

    const audioBuffer = Buffer.from(await file.arrayBuffer());

    const meeting = await meetingService.createMeetingFromUpload({
      title,
      audioBuffer,
      originalName: file.name,
    });

    return ok(meeting, 201);
  } catch (error) {
    return fail(error);
  }
}
