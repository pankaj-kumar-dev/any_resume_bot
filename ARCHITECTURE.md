# Architecture

Map of every folder and file, what it is for, and what kind of code belongs there.

## Folder tree

```
resume-chatbot/                      PROJECT ROOT (own git repo). Holds two apps, no package.json here
├── README.md                        project overview, how to run
├── ARCHITECTURE.md                  this file
├── .git/                            git history for this project
│
├── backend/                         Express + TypeScript API  (port 3000)
│   ├── package.json                 backend dependencies and scripts
│   ├── package-lock.json            exact dependency versions (commit it)
│   ├── tsconfig.json                TS config: src/ -> dist/, NodeNext modules, strict
│   ├── .env                         SECRETS, local only, gitignored
│   ├── .env.example                 template of env var names, safe to commit
│   ├── .gitignore                   ignores node_modules, dist, .env
│   ├── README.md                    backend docs
│   ├── dist/                        compiled JS from `npm run build` (generated, ignore)
│   ├── node_modules/                installed packages (generated, ignore)
│   └── src/
│       ├── index.ts                 ENTRY. Loads .env, starts server on PORT
│       ├── app.ts                   APP SETUP. CORS, JSON parser, mounts routes, global error handler
│       │
│       ├── routes/                  ROUTES. Define URLs, read req, call services, send res
│       │   ├── resume.routes.ts       POST /api/resume/upload
│       │   └── chat.routes.ts         POST /api/chat
│       │
│       ├── middleware/              MIDDLEWARE. Runs before the route handler
│       │   └── upload.middleware.ts   multer: parse file upload, PDF only, max 5 MB, 1 file, in memory
│       │
│       ├── services/                SERVICES. Business logic, no req/res
│       │   ├── pdf.service.ts         validate %PDF- signature, extract text with pdf-parse
│       │   └── llm.service.ts         build prompt, call local Ollama (HTTP /api/chat), return answer
│       │
│       ├── repositories/            REPOSITORIES. Only place that talks SQL
│       │   └── resume.repository.ts   saveResume / getResume against Postgres (used by both routes)
│       │
│       └── db/                      DATABASE SETUP
│           ├── pool.ts                pg connection pool from DATABASE_URL
│           └── schema.sql             CREATE TABLE resumes (+ index)
│
└── frontend/                        React + Vite + TypeScript UI  (port 5173)
    ├── package.json                 frontend dependencies and scripts
    ├── package-lock.json
    ├── index.html                   HTML shell, loads src/main.tsx
    ├── vite.config.ts               Vite config. Proxies /api -> http://localhost:3000
    ├── tsconfig*.json               TS configs (app code vs node/config code)
    ├── eslint.config.js             lint rules
    ├── README.md                    default Vite template readme
    ├── public/                      static files served as-is (favicon.svg, icons.svg)
    └── src/
        ├── main.tsx                 ENTRY. Mounts <App /> into #root
        ├── App.tsx                  root component. Currently calls /api/health and shows status
        ├── App.css, index.css       styles
        └── assets/                  images imported by components (hero.png, react.svg, vite.svg)
```

Outside this repo (parent folder `my_resume_bot/`): `docker-compose.yml` starts Postgres 17 for local dev.

## What each backend folder is responsible for

| Folder | Responsibility | Rule of thumb |
|---|---|---|
| `routes/` | HTTP surface: which URL, which method, what to return | Thin. No heavy logic. Validate shape of input, call a service, shape the response |
| `middleware/` | Cross-cutting steps before the handler. Here: upload parsing and file validation (type, size, count) | Reusable across routes |
| `services/` | Business logic: PDF text extraction, prompting the LLM | Knows nothing about Express. Easy to test alone |
| `repositories/` | Data access. All SQL in one place | Routes/services call it, never write SQL themselves |
| `db/` | Connection pool and table definitions | Setup only |
| `app.ts` | Central error handler (end of file) turns thrown errors into JSON responses (multer errors -> 413/400, known PDF errors -> 400, else 500) | Error handling lives here, not in `middleware/` |

Note: the "error handling" part is in `app.ts`, and "validation" is split: file validation in `middleware/upload.middleware.ts`, request-body validation inside `routes/chat.routes.ts`.

## Request flows

### Upload
```
POST /api/resume/upload  (form-data, field "resume")
  -> app.ts (cors, json)
  -> resume.routes.ts
  -> upload.middleware.ts      reject non-PDF / >5MB, put file in req.file.buffer
  -> pdf.service.ts            check %PDF-, extract text, reject empty/scanned
  -> resume.repository.ts      INSERT into Postgres table "resumes"
  <- { resumeId, filename, characterCount }
```

### Chat
```
POST /api/chat  (JSON { resumeId, question })
  -> chat.routes.ts            validate fields, question <= 2000 chars
  -> resume.repository.ts      getResume(resumeId), 404 if missing
  -> llm.service.ts            prompt = rules + <resume>text</resume> + question -> Ollama
  <- { resumeId, question, answer }
     502 if Ollama fails (not running, model not pulled, etc.) (see terminal log for the real error)
```

## Storage

Resumes live in PostgreSQL (table `resumes`, see `backend/src/db/schema.sql`). Only `repositories/resume.repository.ts` runs SQL. Functions are async, so routes must `await` them. Data survives backend restarts. The earlier in-memory `Map` store was removed.

Setup: start Postgres (`docker compose up -d`), run `schema.sql` once, set `DATABASE_URL` in `backend/.env`.

## Key dependencies

Backend: `express`, `cors`, `multer` (uploads), `pdf-parse` (PDF text), Ollama is called with built-in `fetch` (no SDK), `pg` (Postgres), `dotenv`, `tsx` + `typescript` (dev).
Frontend: `react`, `react-dom`, `vite`, `typescript`, `eslint`.

## Environment variables
See `backend/.env.example` and `backend/README.md`.
