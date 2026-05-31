import { z } from "zod";

/**
 * Validated, typed environment variables.
 *
 * Why this exists: reading `process.env.FOO` everywhere gives you `string |
 * undefined` and zero guarantees the value is present or well-formed. Here we
 * parse the whole environment once, fail fast with a readable error if anything
 * is missing, and export a fully-typed `env` object the rest of the app uses.
 *
 * NOTE: This module is server-only. Never import it into client components —
 * it would leak secrets into the browser bundle.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),

  // Transcription service (Python FastAPI wrapper around faster-whisper)
  TRANSCRIPTION_SERVICE_URL: z
    .string()
    .url("TRANSCRIPTION_SERVICE_URL must be a valid URL")
    .default("http://localhost:8000"),

  // Ollama (local LLM server) — used for summary + action-item extraction
  OLLAMA_BASE_URL: z
    .string()
    .url("OLLAMA_BASE_URL must be a valid URL")
    .default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("llama3"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("meeting-notes"),
});

/**
 * Parse once at module load. We pull each value explicitly (rather than passing
 * `process.env`) so Next.js can statically include them in the server bundle.
 */
const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  TRANSCRIPTION_SERVICE_URL: process.env.TRANSCRIPTION_SERVICE_URL,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
});

if (!parsed.success) {
  // Surface a clear, aggregated message instead of a cryptic runtime failure.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `❌ Invalid environment variables:\n${issues}\n\nCheck your .env file against .env.example.`,
  );
}

export const env = parsed.data;
