import type { Prisma } from "@prisma/client";
import { meetingRepository } from "@/server/repositories/meeting.repository";
import { storageService } from "@/server/services/storage.service";
import { aiService } from "@/server/services/ai.service";
import { AppError } from "@/lib/errors";
import {
  toMeetingDTO,
  toMeetingListItemDTO,
  type MeetingDTO,
  type MeetingListItemDTO,
} from "@/types/meeting";

/**
 * Meeting service — the orchestration layer. It coordinates storage, AI and the
 * repository to fulfill use cases, and is the single API the route handlers call.
 * Route handlers stay thin (parse + delegate + respond); all business rules live
 * here.
 */
export const meetingService = {
  /** Dashboard list. */
  async listMeetings(): Promise<MeetingListItemDTO[]> {
    const meetings = await meetingRepository.findAll();
    return meetings.map(toMeetingListItemDTO);
  },

  /** Fetch one meeting (throws NOT_FOUND if missing). */
  async getMeeting(id: string): Promise<MeetingDTO> {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw AppError.notFound(`Meeting "${id}" was not found`);
    }
    return toMeetingDTO(meeting);
  },

  /**
   * Use case: create a meeting from an uploaded audio file.
   * 1. Upload the bytes to Cloudinary.
   * 2. Persist a PENDING meeting row pointing at the stored audio.
   * Processing (transcription/summarization) is triggered separately so the
   * upload request returns quickly.
   */
  async createMeetingFromUpload(params: {
    title: string;
    audioBuffer: Buffer;
    originalName: string;
  }): Promise<MeetingDTO> {
    const stored = await storageService.uploadAudio(
      params.audioBuffer,
      params.originalName,
    );

    try {
      const meeting = await meetingRepository.create({
        title: params.title,
        audioUrl: stored.url,
        audioPublicId: stored.publicId,
      });
      return toMeetingDTO(meeting);
    } catch (error) {
      // If the DB write fails after upload, clean up the orphaned asset.
      await storageService.deleteAudio(stored.publicId);
      throw error;
    }
  },

  /**
   * Use case: run the AI pipeline for a meeting.
   * Idempotency guard: if already COMPLETED, just return it. If already
   * PROCESSING, reject to avoid duplicate, costly AI calls.
   */
  async processMeeting(id: string): Promise<MeetingDTO> {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw AppError.notFound(`Meeting "${id}" was not found`);
    }
    if (meeting.status === "COMPLETED") {
      return toMeetingDTO(meeting);
    }
    if (meeting.status === "PROCESSING") {
      throw new AppError(
        "CONFLICT",
        "This meeting is already being processed.",
      );
    }

    // Mark as processing so the UI can show a spinner and we block duplicates.
    await meetingRepository.setStatus(id, "PROCESSING", { errorMessage: null });

    try {
      const transcript = await aiService.transcribe(meeting.audioUrl);
      const insights = await aiService.generateInsights(transcript);

      const updated = await meetingRepository.update(id, {
        status: "COMPLETED",
        transcript,
        summary: insights.summary,
        actionItems: insights.actionItems as unknown as Prisma.InputJsonValue,
        errorMessage: null,
      });
      return toMeetingDTO(updated);
    } catch (error) {
      // Record the failure so the UI can show a retry-able error state.
      const message =
        error instanceof AppError ? error.message : "Processing failed";
      await meetingRepository.setStatus(id, "FAILED", { errorMessage: message });
      throw error;
    }
  },
};
