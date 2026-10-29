# Backend

Express + TypeScript API for the resume chatbot. Accepts a PDF, extracts its text, stores it, and answers questions about it using a local Ollama model.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | `tsx watch src/index.ts`. Runs TS directly, restarts on source change. **Does not watch `.env`**, restart manually after editing it. |
| `npm run build` | `tsc`. Compiles `src/` to `dist/`. |
| `npm start` | `node dist/index.js`. Runs compiled output (needs `build` first). |

## Environment variables (`.env`, never commit)

| Var | Used by | Meaning |
|---|---|---|
| `PORT` | `index.ts` | Port to listen on (default 3000). |
| `FRONTEND_URL` | `app.ts` (CORS) | Allowed browser origin (default `http://localhost:5173`). |
| `OLLAMA_URL` | `services/llm.service.ts` | Ollama server, default `http://localhost:11434`. |
| `OLLAMA_MODEL` | `services/llm.service.ts` | Model name, default `llama3.2:3b`. Must be pulled first: `ollama pull llama3.2:3b`. |
| `DATABASE_URL` | `db/pool.ts` | Postgres connection string. Required once `db/pool.ts` is imported. |

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | none | `{ status, service }` |
| POST | `/api/resume/upload` | `form-data`, field `resume` (PDF, max 5 MB) | `{ message, resumeId, filename, characterCount }` |
| POST | `/api/chat` | raw JSON `{ "resumeId": "...", "question": "..." }` | `{ resumeId, question, answer }` |

Common errors: `400` bad input, `404` resume id not found, `413` file too big, `502` LLM call failed (real reason is in the backend terminal log).

## Layers (`src/`)

```
index.ts        boot: load .env, start server
app.ts          wiring: cors, json, mount routes, central error handler
routes/         URL endpoints. Thin: read request, call service, send response
middleware/     runs before route handler: upload parsing + file validation
services/       business logic, no Express objects (pdf, llm)
repositories/   database access only (SQL lives here)
db/             pool connection + schema.sql
```

Request path: `route -> middleware -> service -> (repository) -> response`.

## Known state
- Resumes are stored in Postgres through `repositories/resume.repository.ts`. The old in-memory store was removed.
- `db/schema.sql` must be run once against the database to create the `resumes` table.
- No timeout on the Ollama call. First request after idle can be slow (model loads into RAM).

## Database (local)
`../../docker-compose.yml` defines a Postgres 17 container (`resume-chatbot-db`, port 5432). Note: that file currently sits in the **parent** folder `my_resume_bot/`, outside this repo.
