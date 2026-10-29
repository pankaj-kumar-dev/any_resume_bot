# Resume Chatbot

Upload a resume (PDF), then ask questions about it. A local LLM (Ollama, default `llama3.2:3b`) answers using only the resume text. No cloud API key needed.

This folder (`resume-chatbot/`) is the **project root**. It has its own git repo (`.git`) and holds two independent apps:

| Folder | What it is | Runs on |
|---|---|---|
| `backend/` | Express + TypeScript API. Handles PDF upload, text extraction, database, LLM calls. | `http://localhost:3000` |
| `frontend/` | React + Vite + TypeScript UI. Upload a PDF, then chat with it (sends conversation history). | `http://localhost:5173` |

Each app has its **own** `package.json` and `node_modules`. There is no `package.json` in this root folder on purpose. Always `cd` into `backend/` or `frontend/` before running `npm install` or `npm run ...`.

## How the pieces talk

```
Browser (frontend :5173)
   │  fetch("/api/...")
   ▼
Vite dev proxy  (frontend/vite.config.ts: "/api" -> localhost:3000)
   ▼
Express backend (:3000)  ──►  PostgreSQL (docker)  /  Ollama (local, :11434)
```

## Run locally

```bash
# 0. prerequisites: Postgres running (docker compose up -d) and Ollama running with the model pulled:
#    ollama pull llama3.2:3b

# 1. backend
cd backend
cp .env.example .env        # set DATABASE_URL (and OLLAMA_* if not default)
npm install
npm run dev

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Docs in this repo
- `ARCHITECTURE.md` : full folder tree, what each folder/file does, request flow.
- `backend/README.md` : backend details (scripts, env vars, endpoints, layers).
- `frontend/README.md` : default Vite template readme.

## Status
- Done: React chat UI (upload + Q&A with conversation history), PDF upload and text extraction, chat endpoint, local Ollama integration (via `fetch`), health check, resume storage in PostgreSQL (`repositories/`).
- Todo / known issues:
  - Set Ollama `num_ctx`: long resume + history can be silently truncated.
  - Frontend calls `http://localhost:3000` directly instead of the Vite `/api` proxy, so CORS only works from `:5173`.
  - Ollama call has no timeout; invalid resume UUID returns 500 instead of 404.
  - Chat and `resumeId` are lost on page refresh.
