# Transcription Service (faster-whisper)

A small FastAPI service that transcribes audio using
[`faster-whisper`](https://github.com/SYSTRAN/faster-whisper). The Next.js app
calls it over HTTP instead of using a cloud transcription API.

## Run

```bash
cd transcription-service

# 1. Create + activate a virtualenv
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the service (port 8000)
uvicorn main:app --host 0.0.0.0 --port 8000
```

> On first run faster-whisper downloads the model weights and caches them, so
> the first transcription is slower than later ones.

## Configuration (env vars)

| Variable | Default | Notes |
|---|---|---|
| `WHISPER_MODEL_SIZE` | `base` | `tiny` · `base` · `small` · `medium` · `large-v3` |
| `WHISPER_DEVICE` | `cpu` | set to `cuda` if you have an NVIDIA GPU |
| `WHISPER_COMPUTE_TYPE` | `int8` | use `float16` on GPU |
| `DOWNLOAD_TIMEOUT` | `120` | seconds allowed to download the audio |

## API

| Method | Route | Body | Response |
|---|---|---|---|
| `GET` | `/health` | – | `{ status, model, device, compute_type }` |
| `POST` | `/transcribe` | `{ "audioUrl": "https://..." }` | `{ "text", "language", "duration" }` |

The Next.js app reaches this service via `TRANSCRIPTION_SERVICE_URL`
(default `http://localhost:8000`).
