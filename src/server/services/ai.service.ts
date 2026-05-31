import { toFile } from "openai";
import { openai } from "@/lib/openai";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  meetingInsightsSchema,
  type MeetingInsights,
} from "@/schemas/meeting.schema";

/**
 * AI service — all OpenAI interactions live here:
 *   1. transcribe()  -> Whisper speech-to-text
 *   2. generateInsights() -> GPT summary + action items (structured JSON)
 *
 * Keeping both behind one service means prompts, model names, and error
 * handling are in a single, testable place.
 */
export const aiService = {
  /**
   * Transcribe audio located at a public URL (our Cloudinary asset) using
   * Whisper. We download the bytes and hand them to the OpenAI SDK as a File.
   */
  async transcribe(audioUrl: string): Promise<string> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Could not fetch audio (HTTP ${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // Derive a filename+extension so the API can infer the audio container.
      const filename = filenameFromUrl(audioUrl);
      const file = await toFile(Buffer.from(arrayBuffer), filename);

      const transcription = await openai.audio.transcriptions.create({
        file,
        model: env.OPENAI_TRANSCRIBE_MODEL,
        response_format: "text",
      });

      // With response_format: "text", the SDK returns a plain string.
      const text = typeof transcription === "string" ? transcription : "";
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error("Whisper returned an empty transcript");
      }
      return trimmed;
    } catch (error) {
      console.error("[ai] Transcription failed:", error);
      throw new AppError(
        "AI_PROCESSING_FAILED",
        "Failed to transcribe the audio. The file may be corrupt or unsupported.",
      );
    }
  },

  /**
   * Generate a concise summary and structured action items from a transcript.
   * Uses JSON mode so the model must return valid JSON, which we then validate
   * against `meetingInsightsSchema` — if the shape is wrong, we fail rather than
   * persist garbage.
   */
  async generateInsights(transcript: string): Promise<MeetingInsights> {
    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_CHAT_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Here is the meeting transcript. Produce the JSON described.\n\n"""${transcript}"""`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new Error("GPT returned no content");
      }

      const parsedJson = JSON.parse(raw) as unknown;
      // Validate the model output against our contract.
      return meetingInsightsSchema.parse(parsedJson);
    } catch (error) {
      console.error("[ai] Insight generation failed:", error);
      throw new AppError(
        "AI_PROCESSING_FAILED",
        "Failed to generate the summary and action items from the transcript.",
      );
    }
  },
};

const SYSTEM_PROMPT = `You are an expert meeting-notes assistant.
Given a raw meeting transcript, you produce a clean, useful set of notes.

Respond with a single JSON object EXACTLY matching this shape:
{
  "summary": string,            // 3-6 sentence plain-language summary of the meeting
  "actionItems": [              // concrete follow-ups; empty array if none
    {
      "task": string,           // the action to take, phrased imperatively
      "owner": string | null,   // person responsible if clearly stated, else null
      "priority": "low" | "medium" | "high"
    }
  ]
}

Rules:
- Base everything strictly on the transcript; never invent facts or owners.
- Keep the summary neutral and information-dense.
- If there are no action items, return an empty "actionItems" array.
- Output ONLY the JSON object, no markdown, no commentary.`;

/** Build a safe filename (with extension) Whisper can use to detect format. */
function filenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop() || "audio";
    return /\.[a-z0-9]+$/i.test(last) ? last : `${last}.mp3`;
  } catch {
    return "audio.mp3";
  }
}
