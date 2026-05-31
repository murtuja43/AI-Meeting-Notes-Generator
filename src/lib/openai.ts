import OpenAI from "openai";
import { env } from "@/lib/env";

/**
 * Configured OpenAI client (server-only).
 *
 * Used for both Whisper transcription and GPT chat completions. Centralizing
 * construction here means the API key is read in exactly one place.
 */
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
