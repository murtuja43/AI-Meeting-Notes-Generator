import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "@/lib/cloudinary";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export interface StoredAudio {
  url: string;
  publicId: string;
  bytes: number;
  format: string | undefined;
}

/**
 * Storage service — wraps Cloudinary so the rest of the app never touches the
 * Cloudinary SDK directly.
 *
 * Audio is uploaded as `resource_type: "video"` because that is Cloudinary's
 * bucket for time-based media (audio included); using "image" would reject
 * audio files.
 */
export const storageService = {
  /**
   * Upload an in-memory audio buffer to Cloudinary and return its public URL.
   * We use `upload_stream` (buffer-based) rather than a file path because in a
   * serverless environment we only have the bytes from the request, not a disk
   * file.
   */
  async uploadAudio(buffer: Buffer, originalName: string): Promise<StoredAudio> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: env.CLOUDINARY_UPLOAD_FOLDER,
            resource_type: "video",
            // Keep a readable, collision-resistant id derived from the filename.
            public_id: `${Date.now()}-${sanitizeName(originalName)}`,
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              return reject(error ?? new Error("Empty Cloudinary response"));
            }
            resolve(uploadResult);
          },
        );
        stream.end(buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
      };
    } catch (error) {
      console.error("[storage] Cloudinary upload failed:", error);
      throw new AppError(
        "UPLOAD_FAILED",
        "Failed to upload audio to storage. Please try again.",
      );
    }
  },

  /** Delete an asset (used for cleanup if later processing setup fails). */
  async deleteAudio(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } catch (error) {
      // Cleanup is best-effort; log but don't surface to the user.
      console.warn("[storage] Failed to delete asset", publicId, error);
    }
  },
};

/** Strip characters Cloudinary dislikes and the file extension. */
function sanitizeName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 60);
}
