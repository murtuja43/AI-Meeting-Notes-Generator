import { Ollama } from "ollama";
import { env } from "@/lib/env";

/**
 * Configured Ollama client (server-only).
 *
 * Talks to a locally-running Ollama server (default http://localhost:11434)
 * which serves the Llama 3 model. Used for summarization and action-item
 * extraction. Centralizing construction here means the host is read in exactly
 * one place — mirroring how `lib/cloudinary.ts` wraps Cloudinary.
 */
export const ollama = new Ollama({ host: env.OLLAMA_BASE_URL });
