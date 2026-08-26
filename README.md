# AI Meeting Assistant — Backend

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your keys:

```powershell
copy .env.example .env
```

Copy your existing `cookies.txt` (exported per your earlier Option B) into the project root — the downloader will use it automatically if present.

## Run

```powershell
uvicorn main:app --port 2210 --reload
```

- API base: http://127.0.0.1:2210
- Swagger UI: http://127.0.0.1:2210/docs

## Try it

1. `POST /api/v1/meetings` with either `youtube_url` + `language` (form fields) OR a `file` upload + `language`. Returns `202` immediately with a `meeting_id` and `status: pending`.
2. Poll `GET /api/v1/meetings/{meeting_id}` until `status` becomes `ready` (or `failed`, check `error.code`/`error.message`).
3. `GET /api/v1/meetings/{meeting_id}/transcript`
4. `GET /api/v1/meetings/{meeting_id}/summary`
5. `POST /api/v1/meetings/{meeting_id}/chat` with `{"question": "..."}`

## What's implemented in this increment

- Full pipeline: YouTube download / file upload → WAV conversion → chunking → transcription (Whisper or Sarvam, chosen by `language`) → summary + action items + decisions + questions (Mistral) → Chroma vector index → RAG chat.
- Meeting lifecycle tracked via `status` (`pending → downloading → chunking → transcribing → analyzing → indexing → ready/failed`).
- In-memory meeting store (per your call — lost on restart/`--reload`; swap `app/models/meeting_store.py` for a SQLModel-backed store later without touching any route or service code).
- Centralized error handling — every failure mode from your spec maps to one of the `AppException` subclasses in `app/core/exceptions.py`, returned as `{"success": false, "error": {"code": ..., "message": ...}}`. No stack traces or key values ever reach the client.
- CORS open (`*`) for easy vanilla-JS frontend integration during dev — tighten `CORS_ORIGINS` in `.env` before deploying.

## Not yet built (next increment)

- `GET /meetings/{id}/export` — TXT/PDF export. Stub the route or ask me to build `app/services/export/` next; `fpdf2` is already in `requirements.txt` for this.
- Structured `ActionItem` list parsing — action items/decisions/questions currently come back as the raw formatted string from Mistral (matches your original `extractor.py` behavior exactly). Turning that into a real `list[ActionItem]` needs either a second structured-output LLM call or a parser — flag if you want that now vs. later.
- Concurrent LLM calls in the analysis stage (title/summary/action items/decisions/questions currently run sequentially, not via `asyncio.gather`) — safe to parallelize later once you've confirmed the sequential version works end-to-end.

## Known dependency note

`openai-whisper` pulls in `torch`, which is a large install (~2GB+). If you only plan to test the Hinglish/Sarvam path initially, you can comment out `openai-whisper` in `requirements.txt` and skip Whisper until needed — but `english` language requests will fail with a clear `TRANSCRIPTION_FAILED` error until it's installed.
