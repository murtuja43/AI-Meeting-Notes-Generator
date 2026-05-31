import type { Meeting, MeetingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Meeting repository — the ONLY place that talks to Prisma for the Meeting
 * model. Services depend on these functions, never on Prisma directly. This
 * isolates all database concerns so we could swap the ORM or add caching in one
 * place, and keeps query logic out of business logic.
 */
export const meetingRepository = {
  /** Newest-first list for the dashboard. */
  findAll(): Promise<Meeting[]> {
    return prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  /** Single meeting by id, or null if it doesn't exist. */
  findById(id: string): Promise<Meeting | null> {
    return prisma.meeting.findUnique({ where: { id } });
  },

  /** Create the initial PENDING record right after upload. */
  create(data: {
    title: string;
    audioUrl: string;
    audioPublicId: string;
  }): Promise<Meeting> {
    return prisma.meeting.create({
      data: {
        title: data.title,
        audioUrl: data.audioUrl,
        audioPublicId: data.audioPublicId,
        status: "PENDING",
      },
    });
  },

  /** Update arbitrary fields (used by the processing pipeline). */
  update(id: string, data: Prisma.MeetingUpdateInput): Promise<Meeting> {
    return prisma.meeting.update({ where: { id }, data });
  },

  /** Convenience helper to move a meeting to a new status. */
  setStatus(
    id: string,
    status: MeetingStatus,
    extra?: Prisma.MeetingUpdateInput,
  ): Promise<Meeting> {
    return prisma.meeting.update({
      where: { id },
      data: { status, ...extra },
    });
  },
};
