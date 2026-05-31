import { ollama } from "@/lib/ollama";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  meetingInsightsSchema,
  type MeetingInsights,
} from "@/schemas/meeting.schema";

/**
 * AI service — all model interactions live here:
 *   1. transcribe()       -> faster-whisper, via the Python transcription sidecar
 *   2. generateInsights() -> Ollama + Llama 3 (summary + action items, JSON)
 *
 * Both run on local/self-hosted infrastructure (no third-party AI API). The rest
 * of the app is unaware of this — it just calls these two methods, exactly as
 * before. That isolation is why swapping OpenAI for local models touched only
 * this file plus the two clients it imports.
 */
export const aiService = {
  /**
   * Transcribe audio located at a public URL (our Cloudinary asset).
   *
   * faster-whisper is a Python library, so transcription runs in a small FastAPI
   * sidecar (see `transcription-service/`). We POST the audio URL; the service
   * downloads the file, runs faster-whisper, and returns the text. This keeps
   * Node free of any Python/ML dependencies and lets transcription scale (and
   * use a GPU) independently.
   */
  async transcribe(audioUrl: string): Promise<string> {
    try {
      const response = await fetch(`${env.TRANSCRIPTION_SERVICE_URL}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Transcription service responded ${response.status}: ${detail}`,
        );
      }

      const data = (await response.json()) as { text?: string };
      const text = (data.text ?? "").trim();
      if (!text) {
        throw new Error("Transcription service returned an empty transcript");
      }
      return text;
    } catch (error) {
      console.error("[ai] Transcription failed:", error);
      throw new AppError(
        "AI_PROCESSING_FAILED",
        "Failed to transcribe the audio. Is the transcription service running?",
      );
    }
  },

  /**
   * Generate a concise summary and structured action items from a transcript
   * using Llama 3 via Ollama.
   *
   * We use Ollama's JSON `format` mode so the model must return syntactically
   * valid JSON, then validate that JSON against `meetingInsightsSchema` — if the
   * shape is wrong, we fail instead of persisting garbage. (Same safety contract
   * we had with GPT's JSON mode.)
   */
  async generateInsights(transcript: string): Promise<MeetingInsights> {
    try {
      const response = await ollama.chat({
        model: env.OLLAMA_MODEL,
        // Force valid JSON output. The system prompt MUST also instruct the
        // model to emit JSON, otherwise Ollama can stall generating whitespace.
        format: "json",
        stream: false,
        options: { temperature: 0.2 },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Here is the meeting transcript. Produce the JSON described.\n\n"""${transcript}"""`,
          },
        ],
      });

      const raw = response.message?.content;
      if (!raw) {
        throw new Error("Ollama returned no content");
      }

      const parsedJson = JSON.parse(raw) as unknown;
      // Validate the model output against our contract.
      return meetingInsightsSchema.parse(parsedJson);
    } catch (error) {
      console.error("[ai] Insight generation failed:", error);
      throw new AppError(
        "AI_PROCESSING_FAILED",
        "Failed to generate the summary and action items. Is Ollama running with the Llama 3 model pulled?",
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
