# 🎙️ AI Meeting Notes Generator

Upload a meeting recording and get an **AI-generated transcript, summary, and action items** — powered by **faster-whisper** (speech-to-text) and **Llama 3 via Ollama** (summarization). Runs **fully locally**, with no third-party AI API.

Built with a clean, layered architecture to demonstrate production AI-engineering practices.

> **Status:** Phase 1 (MVP) complete.

---

## ✨ Features (Phase 1)

- Upload meeting audio (drag & drop) → stored on Cloudinary
- Automatic transcription with **faster-whisper** (local Python sidecar)
- AI **summary** + structured **action items** (with owner & priority) via **Llama 3 / Ollama** (JSON mode + Zod-validated output)
- Persistent **meeting history** (PostgreSQL + Prisma)
- Dashboard + meeting detail pages with audio player
- Full **loading**, **empty**, and **error** states throughout
- Strict TypeScript, reusable shadcn/ui components

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL + Prisma ORM |
| Storage | Cloudinary |
| Transcription | faster-whisper (Python FastAPI sidecar) |
| Summarization | Llama 3 via Ollama (`ollama` JS client) |
| Validation | Zod |
| Deploy | Self-hosted / long-running host (needs Python + Ollama) |

## 🏗️ Architecture

A layered (clean) architecture — the UI never talks to OpenAI/Cloudinary/Prisma directly:

```
UI (pages + components)
  → API Route Handlers (validate + map errors)
    → Services (business logic: meeting / ai / storage)
      → Repository (Prisma) · Ollama client · Cloudinary
        → PostgreSQL · Transcription sidecar (faster-whisper) · Ollama (Llama 3) · Cloudinary
```

```
src/
  app/                      # Pages + API routes
    api/meetings/           # GET list · POST upload · [id] · [id]/process
    meeting/[id]/           # Meeting detail page
    page.tsx                # Dashboard
  components/               # ui/ (shadcn) · meetings/ · upload/ · shared/
  server/
    services/               # meeting / ai / storage — business logic
    repositories/           # meeting.repository — all Prisma access
  lib/                      # env · prisma · cloudinary · ollama · errors · api-response
  schemas/                  # Zod schemas (request + AI output)
  types/                    # DTOs + Prisma→DTO mappers
prisma/schema.prisma        # Meeting model + MeetingStatus enum
transcription-service/      # Python FastAPI sidecar wrapping faster-whisper
```

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and Python 3.9+
- A PostgreSQL database (local, or free hosted: [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- [Ollama](https://ollama.com) installed locally
- A [Cloudinary account](https://cloudinary.com)

### 2. Install Node deps
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# then fill in DATABASE_URL and the CLOUDINARY_* values.
# TRANSCRIPTION_SERVICE_URL / OLLAMA_* already default to localhost.
```

### 4. Set up the database
```bash
npm run prisma:generate      # generate the Prisma client
npm run prisma:migrate       # create the Meeting table (dev migration)
# or, for a quick prototype DB without migration history:
# npm run db:push
```

### 5. Start the local AI services
```bash
# (a) Ollama + Llama 3 — pull the model once, then Ollama serves it on :11434
ollama pull llama3

# (b) faster-whisper transcription sidecar (in a second terminal)
cd transcription-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```
See [`transcription-service/README.md`](transcription-service/README.md) for model/GPU options.

### 6. Run the app
```bash
npm run dev
# open http://localhost:3000
```

> **You need three things running**: the Next.js app, Ollama (`ollama serve`,
> usually automatic), and the transcription sidecar on port 8000.

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:studio` | Open Prisma Studio |

## 🔌 API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/meetings` | List meeting history |
| `POST` | `/api/meetings` | Upload audio + create a meeting (multipart: `title`, `audio`) |
| `GET` | `/api/meetings/:id` | Get a single meeting |
| `POST` | `/api/meetings/:id/process` | Run Whisper + GPT and store results |

All responses use a consistent envelope:
```jsonc
// success
{ "success": true, "data": { /* ... */ } }
// failure
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

## ☁️ Deployment

Because transcription (faster-whisper) and summarization (Ollama/Llama 3) run as
**local long-running processes**, this stack is **not** a fit for Vercel's
serverless runtime as-is. Deploy options:

- **Single VM / server** (recommended): run the Next.js app, the transcription
  sidecar, and Ollama on one host (e.g. with `docker compose` or `pm2` /
  `systemd`). Point `TRANSCRIPTION_SERVICE_URL` and `OLLAMA_BASE_URL` at the
  local ports.
- **Split**: host the Next.js app anywhere that allows outbound HTTP, and run
  the transcription service + Ollama on a GPU box; set the two URLs to that box.

Use a hosted Postgres (Neon/Supabase) for `DATABASE_URL`. `postinstall`/`build`
run `prisma generate` automatically.

> Want to keep serverless/Vercel? Swap these two services back to a hosted API
> in `src/server/services/ai.service.ts` — that one file is the only AI boundary.

## 🗺️ Roadmap
- **Phase 2** — Speaker diarization, auto title/topic/keyword extraction, dashboard analytics
- **Phase 3** — Auth, user accounts, per-user meetings
- **Phase 4** — RAG: embeddings + vector DB + "chat with your meeting"
- **Phase 5** — PDF/DOCX/email export, advanced UI

## 📄 License
MIT
