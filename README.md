# 🎙️ AI Meeting Notes Generator

Upload a meeting recording and get an **AI-generated transcript, summary, and action items** — powered by OpenAI Whisper (speech-to-text) and GPT (summarization).

Built with a clean, layered architecture to demonstrate production AI-engineering practices.

> **Status:** Phase 1 (MVP) complete.

---

## ✨ Features (Phase 1)

- Upload meeting audio (drag & drop) → stored on Cloudinary
- Automatic transcription with **Whisper**
- AI **summary** + structured **action items** (with owner & priority) via **GPT** (JSON mode + Zod-validated output)
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
| AI | OpenAI Whisper + GPT |
| Validation | Zod |
| Deploy | Vercel |

## 🏗️ Architecture

A layered (clean) architecture — the UI never talks to OpenAI/Cloudinary/Prisma directly:

```
UI (pages + components)
  → API Route Handlers (validate + map errors)
    → Services (business logic: meeting / ai / storage)
      → Repository (Prisma) · OpenAI · Cloudinary
        → PostgreSQL · OpenAI APIs · Cloudinary
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
  lib/                      # env · prisma · cloudinary · openai · errors · api-response
  schemas/                  # Zod schemas (request + AI output)
  types/                    # DTOs + Prisma→DTO mappers
prisma/schema.prisma        # Meeting model + MeetingStatus enum
```

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- A PostgreSQL database (local, or free hosted: [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Cloudinary account](https://cloudinary.com)

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# then fill in DATABASE_URL, OPENAI_API_KEY, and the CLOUDINARY_* values
```

### 4. Set up the database
```bash
npm run prisma:generate      # generate the Prisma client
npm run prisma:migrate       # create the Meeting table (dev migration)
# or, for a quick prototype DB without migration history:
# npm run db:push
```

### 5. Run
```bash
npm run dev
# open http://localhost:3000
```

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

## ☁️ Deploy to Vercel
1. Push to GitHub and import the repo in Vercel.
2. Add all env vars from `.env.example` in Project Settings → Environment Variables.
3. Use a hosted Postgres (Neon/Supabase) for `DATABASE_URL`.
4. Deploy. `postinstall`/`build` run `prisma generate` automatically.

## 🗺️ Roadmap
- **Phase 2** — Speaker diarization, auto title/topic/keyword extraction, dashboard analytics
- **Phase 3** — Auth, user accounts, per-user meetings
- **Phase 4** — RAG: embeddings + vector DB + "chat with your meeting"
- **Phase 5** — PDF/DOCX/email export, advanced UI

## 📄 License
MIT
