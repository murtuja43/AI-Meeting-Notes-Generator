import type { Meeting as PrismaMeeting, MeetingStatus } from "@prisma/client";
import type { ActionItem } from "@/schemas/meeting.schema";

export type { MeetingStatus };
export type { ActionItem };

/**
 * Data Transfer Object sent to the client.
 *
 * We deliberately do NOT return the raw Prisma model to the browser:
 *  - `actionItems` is `Prisma.JsonValue` on the model; here it's a typed
 *    `ActionItem[]`, so components get real autocompletion.
 *  - Dates are serialized to ISO strings (JSON has no Date type).
 *  - It gives us a stable API contract decoupled from the DB schema.
 */
export interface MeetingDTO {
  id: string;
  title: string;
  audioUrl: string;
  status: MeetingStatus;
  transcript: string | null;
  summary: string | null;
  actionItems: ActionItem[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight shape for the dashboard list (no heavy transcript text). */
export interface MeetingListItemDTO {
  id: string;
  title: string;
  status: MeetingStatus;
  summary: string | null;
  actionItemCount: number;
  createdAt: string;
}

/**
 * Map a Prisma Meeting row to the full client DTO.
 * Centralizing this conversion guarantees every endpoint serializes meetings
 * identically.
 */
export function toMeetingDTO(meeting: PrismaMeeting): MeetingDTO {
  return {
    id: meeting.id,
    title: meeting.title,
    audioUrl: meeting.audioUrl,
    status: meeting.status,
    transcript: meeting.transcript,
    summary: meeting.summary,
    actionItems: normalizeActionItems(meeting.actionItems),
    errorMessage: meeting.errorMessage,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}

/** Map a Prisma Meeting row to the lightweight list DTO. */
export function toMeetingListItemDTO(meeting: PrismaMeeting): MeetingListItemDTO {
  return {
    id: meeting.id,
    title: meeting.title,
    status: meeting.status,
    summary: meeting.summary,
    actionItemCount: normalizeActionItems(meeting.actionItems).length,
    createdAt: meeting.createdAt.toISOString(),
  };
}

/**
 * The DB stores actionItems as freeform JSON. This safely coerces it back into
 * a typed array, tolerating null/legacy data without throwing.
 */
function normalizeActionItems(value: PrismaMeeting["actionItems"]): ActionItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ActionItem =>
      typeof item === "object" &&
      item !== null &&
      "task" in item &&
      typeof (item as { task: unknown }).task === "string",
  );
}
