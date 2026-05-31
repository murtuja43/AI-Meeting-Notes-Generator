"""
Transcription microservice for the AI Meeting Notes Generator.

A thin FastAPI wrapper around `faster-whisper`. The Next.js app POSTs an audio
URL (a Cloudinary asset); this service downloads the file, runs faster-whisper
locally, and returns the transcript text.

Why a separate service?
- faster-whisper is a Python/CTranslate2 library and cannot run inside the
  Node.js/Next.js runtime.
- Keeping it as its own HTTP service preserves the app's clean boundaries (the
  Node `ai.service` just makes an HTTP call, exactly like it used to call OpenAI)
  and lets transcription scale / use a GPU independently of the web app.

Run locally:
    cd transcription-service
    python -m venv .venv && source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000

Configuration (environment variables):
    WHISPER_MODEL_SIZE   default "base"  (tiny|base|small|medium|large-v3)
    WHISPER_DEVICE       default "cpu"   (use "cuda" if you have a GPU)
    WHISPER_COMPUTE_TYPE default "int8"  ("float16" recommended on GPU)
    DOWNLOAD_TIMEOUT     default "120"   (seconds to download the audio)
"""

import os
import tempfile
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from faster_whisper import WhisperModel

# --- Configuration -----------------------------------------------------------
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
DOWNLOAD_TIMEOUT = float(os.getenv("DOWNLOAD_TIMEOUT", "120"))

app = FastAPI(title="Meeting Notes Transcription Service", version="1.0.0")

# Load the model once at startup. Model weights are downloaded and cached on
# first use, so the first run may take a little longer.
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)


# --- Request / response schemas ---------------------------------------------
class TranscribeRequest(BaseModel):
    audioUrl: str


class TranscribeResponse(BaseModel):
    text: str
    language: str | None = None
    duration: float | None = None


# --- Routes ------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    """Liveness probe + reports which model is loaded."""
    return {
        "status": "ok",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE,
    }


@app.post("/transcribe", response_model=TranscribeResponse)
def transcribe(req: TranscribeRequest) -> TranscribeResponse:
    """Download the audio at `audioUrl` and transcribe it with faster-whisper."""
    audio_bytes = _download_audio(req.audioUrl)
    suffix = _suffix_from_url(req.audioUrl)

    # faster-whisper reads from a file path, so write the bytes to a temp file.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = " ".join(segment.text.strip() for segment in segments).strip()

        if not text:
            raise HTTPException(status_code=422, detail="Transcript was empty")

        return TranscribeResponse(
            text=text,
            language=getattr(info, "language", None),
            duration=getattr(info, "duration", None),
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - surface any model error as 500
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}")
    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except OSError:
                pass


# --- Helpers -----------------------------------------------------------------
def _download_audio(url: str) -> bytes:
    """Fetch the audio bytes from the given URL (the Cloudinary asset)."""
    try:
        with httpx.Client(timeout=DOWNLOAD_TIMEOUT, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.content
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Failed to download audio: {exc}"
        )


def _suffix_from_url(url: str) -> str:
    """Derive a file extension from the URL so the decoder can detect the format."""
    path = urlparse(url).path
    _, ext = os.path.splitext(path)
    return ext if ext else ".mp3"
