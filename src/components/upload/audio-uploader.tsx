"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileAudio, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_AUDIO_TYPES,
  MAX_AUDIO_BYTES,
  validateAudioFile,
} from "@/schemas/meeting.schema";
import type { ApiResponse } from "@/lib/api-response";
import type { MeetingDTO } from "@/types/meeting";

/**
 * Client component: drag-and-drop / click-to-select audio uploader.
 *
 * Flow on submit:
 *   1. POST /api/meetings (multipart) -> creates a PENDING meeting.
 *   2. Navigate to /meeting/[id], where processing is kicked off.
 * Keeping the upload request short (no AI here) means snappy feedback; the
 * heavy Whisper/GPT work happens on the detail page.
 */
export function AudioUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectFile(candidate: File | undefined) {
    setError(null);
    if (!candidate) return;
    const result = validateAudioFile(candidate);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFile(candidate);
    // Default the title to the file name (sans extension) for convenience.
    if (!title.trim()) {
      setTitle(candidate.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose an audio file first.");
      return;
    }
    if (!title.trim()) {
      setError("Please give this meeting a title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("audio", file);

      const res = await fetch("/api/meetings", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as ApiResponse<MeetingDTO>;

      if (!json.success) {
        setError(json.error.message);
        return;
      }

      // Reset and navigate to the detail page, which starts AI processing.
      router.push(`/meeting/${json.data.id}`);
    } catch {
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          selectFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50 hover:bg-accent/40",
          isSubmitting && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_AUDIO_TYPES.join(",")}
          className="hidden"
          onChange={(e) => selectFile(e.target.files?.[0])}
          disabled={isSubmitting}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <FileAudio className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag &amp; drop audio, or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              mp3, m4a, wav, webm, ogg · up to{" "}
              {Math.round(MAX_AUDIO_BYTES / (1024 * 1024))}MB
            </p>
          </>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="meeting-title" className="text-sm font-medium">
          Meeting title
        </label>
        <Input
          id="meeting-title"
          placeholder="e.g. Q3 Planning Sync"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          disabled={isSubmitting}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isSubmitting || !file}>
        {isSubmitting ? (
          <LoadingSpinner label="Uploading…" className="text-primary-foreground" />
        ) : (
          "Upload meeting"
        )}
      </Button>
    </form>
  );
}
