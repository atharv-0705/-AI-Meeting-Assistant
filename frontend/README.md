# Nexora — Frontend

React + Vite frontend for the AI Meeting Assistant backend. Talks to the FastAPI
backend running at `http://127.0.0.1:2210` by default.

## Setup

```bash
npm install
cp .env.example .env
```

`.env` sets `VITE_API_BASE_URL` — leave it as-is if your backend runs on the
default port 2210.

## Run

Make sure the backend is running first:

```bash
uvicorn main:app --port 2210 --reload
```

Then, in this folder:

```bash
npm run dev
```

Opens at `http://localhost:5173` by default.

## Build for production

```bash
npm run build
npm run preview   # serve the built bundle locally to sanity-check it
```

## What's wired up

- **Capture** — YouTube URL or file upload, language select (English/Hinglish), `POST /api/v1/meetings`.
- **Understand** — polls `GET /api/v1/meetings/{id}` every 3s until `ready`/`failed`; on ready, fetches `GET /transcript` and `GET /summary` and renders the full dashboard (overview, summary, action items, key decisions, open questions, expandable transcript).
- **Ask** — chat panel calling `POST /api/v1/meetings/{id}/chat`, with typing indicator, auto-scroll, Enter-to-send, and per-message error display.
- **Export** — TXT/PDF buttons hit `GET /api/v1/meetings/{id}/export?format=`, and trigger a real browser download via blob URL.
- **Theme** — dark/light toggle in the header, persisted to `localStorage`, applied via `data-theme` on `<html>` and CSS custom properties in `src/theme.css`.
- **Errors** — every API call goes through `src/services/api.js`, which normalizes backend errors (`{success:false, error:{code,message}}`) and network failures into one `ApiError` shape. No raw stack traces or backend internals ever reach the UI.

## Known limitation carried over from the backend

Action items, key decisions, and open questions are returned by the backend as
raw formatted strings from the LLM (not structured JSON per-item), matching
your original `extractor.py` design. The dashboard parses them into list items
by splitting on newlines — this works well for the LLM's numbered-list output
but isn't a guaranteed structured parse. If you want true `{task, owner,
deadline}` objects per action item, that needs a backend change (a second
structured-output LLM call), not just a frontend one.
