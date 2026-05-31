import { z } from "zod";

/**
 * Zod schemas — the single source of truth for the shapes that cross a trust
 * boundary: incoming API requests AND the JSON we ask GPT to produce. Defining
 * them once means our TypeScript types, runtime validation, and AI output
 * contract can never drift apart.
 */

// --- Constants used for upload validation ---
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB (OpenAI Whisper limit)
export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg", // .mp3
  "audio/mp4", // .m4a
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
] as const;

/**
 * Validates the multipart upload form on the server.
 * The audio file itself is validated separately (see `validateAudioFile`)
 * because `File` objects don't round-trip cleanly through plain Zod in all
 * runtimes; this schema covers the text fields.
 */
export const createMeetingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must be 150 characters or fewer"),
});
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

/** Validate a single action item produced by GPT. */
export const actionItemSchema = z.object({
  task: z.string().min(1),
  owner: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
export type ActionItem = z.infer<typeof actionItemSchema>;

/**
 * The exact JSON contract we require back from GPT. We parse the model's reply
 * through this schema; if the model hallucinates a wrong shape, parsing fails
 * loudly instead of silently corrupting our database.
 */
export const meetingInsightsSchema = z.object({
  summary: z.string().min(1, "summary must not be empty"),
  actionItems: z.array(actionItemSchema).default([]),
});
export type MeetingInsights = z.infer<typeof meetingInsightsSchema>;

/**
 * Server-side validation of the uploaded audio file. Returns the file on
 * success or a human-readable error string on failure (kept as a helper rather
 * than a Zod schema so it works identically in every runtime).
 */
export function validateAudioFile(
  file: unknown,
): { ok: true; file: File } | { ok: false; error: string } {
  if (!(file instanceof File)) {
    return { ok: false, error: "No audio file was provided" };
  }
  if (file.size === 0) {
    return { ok: false, error: "The uploaded file is empty" };
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return {
      ok: false,
      error: "Audio file is too large (max 25MB)",
    };
  }
  if (!ACCEPTED_AUDIO_TYPES.includes(file.type as (typeof ACCEPTED_AUDIO_TYPES)[number])) {
    return {
      ok: false,
      error: `Unsupported audio type "${file.type || "unknown"}". Use mp3, m4a, wav, webm or ogg.`,
    };
  }
  return { ok: true, file };
}
