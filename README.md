# Vector Front Desk ERP

Monorepo for **Vector Advert's** internal ERP platform — a suite of department
modules sharing one Supabase backend, plus a shared AI assistant.

Each module is an independent deployable app with its own `package.json` and
Vite config. There is no root workspace runner — install and run each module
from its own directory.

---

## Modules

| Path | App | Stack | Notes |
|---|---|---|---|
| `front-desk-app/` | Front Desk / Design / Production / Client Portal | React 19 + Vite 8 + Tailwind 4 + Supabase | Main ERP app. Supabase migrations live here. |
| `marketing-app/` | Marketing (campaigns, tenders, proposals, proformas, tasks) | React 19 + Vite 8 + TS + Tailwind 3 + TanStack Query + Zustand + Radix | Full rewrite of the legacy static `marketing/`. |
| `creative/` | Creative Product Development (ideas, prototypes, budget, HR tabs) | React 19 + Vite + Tailwind 3 + Supabase | Replaces `designers.html`. |
| `finance/finance-app/` | Finance (GL, journal, payroll, purchases, sales, reports) | React 19 + Vite + Tailwind 4 + Supabase + Recharts | See `finance/finance-app/README.md`. |
| `ai-ms-app/` | AI Assistant API | FastAPI + LangChain/LangGraph + Gemini | Deployed to Vercel as serverless functions. |
| `machine-opp/` | Machine Operations (legacy, static) | Vanilla JS + Tailwind CDN + Supabase | Bundled to a single `index.html`. |
| `marketing/` | Marketing (legacy, static) | Vanilla JS + Tailwind CDN + Supabase | Superseded by `marketing-app/`. |
| `KPIs/` | KPI fetch script | Node (`@supabase/supabase-js`, `dotenv`) | `node fetch_kpis.mjs`; see `KPIs/kpi.md`. |
| `main-app/`, `location-based-login/`, `Front_Desk_6.html`, `production.html` | Standalone prototypes / single pages | Static HTML | Legacy, no build step. |

The only deployed root config is `vercel.json`, which points Vercel at
`ai-ms-app` (`rootDirectory`).

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS, Radix/Base UI,
  TanStack Query, Zustand, react-hook-form + Zod, Chart.js / Recharts,
  jsPDF + autoTable (PDF/Excel export), `vite-plugin-singlefile` (SPA builds
  emit one HTML file for easy static hosting).
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + RLS).
  Schema is managed through `front-desk-app/supabase/migrations` (49 migrations).
- **AI**: FastAPI, LangChain, LangGraph, Google Gemini
  (chat + `gemini-embedding-001` embeddings for RAG).
- **Legacy**: plain JS + Tailwind CDN, bundled by `bundle.py`.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+ with [uv](https://docs.astral.sh/uv/) (only for `ai-ms-app`)
- Supabase CLI (optional, for local DB work)
- A Supabase project, or `supabase start` for local development

### Front Desk app

```bash
cd front-desk-app
npm install
cp .env.example .env      # fill in Supabase URL/keys
npm run dev               # http://localhost:5173
npm run build
npm run lint              # oxlint
```

Local database:

```bash
supabase start
supabase db reset        # applies migrations + seed.sql
```

### Marketing / Creative / Finance apps

Same shape — `npm install`, `npm run dev`, `npm run build`, `npm run lint`.
See each app's README for module-specific detail.

### AI Assistant API

```bash
cd ai-ms-app
uv sync
cp .env.example .env
uv run python main.py     # http://localhost:8000
```

Interactive API docs: `http://localhost:8000/api/v1/docs`
Health check: `GET /health`
Endpoint list: `ai-ms-app/api.md`

### Legacy static apps

The static modules load their JS/CSS from a CDN, so serve the directory
directly — no install required:

```bash
python3 -m http.server 8001 --directory machine-opp
```

To rebuild the single-file bundles:

```bash
python3 marketing/bundle.py
python3 machine-opp/bundle.py
```

---

## Environment Variables

Never commit `.env` files (they are git-ignored). Every Vite app reads its
config from `import.meta.env`, the API from `os.getenv`.

### Frontend apps (`VITE_*`)

```env
# front-desk-app, creative
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<service role key>   # only where admin access is required
VITE_AI_API_URL=<AI assistant base URL>

# finance/finance-app — reads four projects
VITE_FINANCE_URL=...     VITE_FINANCE_ANON_KEY=...
VITE_FRONTDESK_URL=...   VITE_FRONTDESK_ANON_KEY=...
VITE_STORE_URL=...       VITE_STORE_ANON_KEY=...
VITE_HR_URL=...          VITE_HR_ANON_KEY=...
```

### `ai-ms-app`

| Variable | Default | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | — | Gemini access (required) |
| `GOOGLE_CHAT_MODEL` | `gemini-2.0-flash` | Chat model |
| `GOOGLE_EMBEDDING_MODEL` | `gemini-embedding-001` | Embedding model |
| `SUPABASE_URL` | — | ERP database |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Server-side DB access |
| `CHAT_HISTORY_LIMIT` | `20` | Messages replayed as context |
| `RAG_MATCH_COUNT` | `3` | Retrieved chunks per question |
| `BACKEND_URL` | `http://localhost:8000` | Self-reference for generated file links |
| `GENERATED_FILES_DIR` | `/tmp/yope_generated` | Where generated PDFs/docs are written |

### `KPIs/` script

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (read via
`dotenv`).

---

## Data Model & Roles

Schema documentation lives in the root `*.md` files:

- `front_desk_full_database_schema.md` — every table, column and type
- `front_desk_db_schema_relationships.md` — foreign-key / ER view
- `ai-ms-app/schema.md`, `ai-ms-app/supabase_schema.sql` — AI assistant tables
- `marketing-app/db_schema.md`, `marketing-app/sb_relationship.md`
- `finance/finance_db_schema.md` + `finance/*.sql`

ERP roles (see `users.role`): `admin`, `front_desk`, `designer`,
`machine_operator`, `finish`, `marketer`, `admin_marketer`, `finance`,
`creative`. Routing and navigation are role-gated in the client
(`RoleRouter.jsx`, `ProtectedRoute.jsx`, `authStore.ts`); authorisation is
enforced by Supabase RLS.

The AI assistant mirrors the live schema in `ai-ms-app/app/erp_schema.py`, a
static table/column registry the agent uses to validate names before hitting
PostgREST and to introspect at runtime.

---

## The AI Assistant

`ai-ms-app` is a FastAPI service that backs the floating assistant embedded in
each frontend app.

- **RAG** — uploaded attachments (`.txt`, `.md`, `.csv`, `.json`, `.log`,
  `.py`, `.html`, XML/YAML, PDF, DOCX, XLSX) are chunked, embedded with
  Gemini, and retrieved alongside the ERP schema context.
- **Sessions** — per-user chat sessions, messages and attachments with full
  CRUD (`/api/v1/users/{user_id}/sessions/...`).
- **Agent** — LangGraph agent with in-memory checkpointing can query the ERP
  database and draft replies ("Yope AI").
- **File generation** — produces downloadable PDF/DOCX/XLSX artifacts served
  from `GET /api/v1/download/{filename}`.

---

## Deployment

| Target | How |
|---|---|
| Frontend apps | Each builds to a **single HTML file** (`vite-plugin-singlefile`) — upload to any static host, or connect the Vercel project and point `rootDirectory` at the app. |
| `ai-ms-app` | Vercel serverless function from `main.py`; `ai-ms-app/vercel.json` sets a 60s max duration and excludes `.venv`/`.env`. |
| Legacy static apps | Serve `index.html` after running `bundle.py`. |

---

## Repository Layout

```
.
├── front-desk-app/        # main ERP SPA + Supabase migrations
├── marketing-app/         # marketing SPA (TS)
├── creative/              # creative product development SPA
├── finance/               # finance SQL + finance-app SPA
├── ai-ms-app/             # FastAPI AI assistant (Vercel functions)
├── machine-opp/           # legacy machine operations SPA
├── marketing/             # legacy marketing SPA
├── KPIs/                  # KPI extraction script
├── main-app/              # standalone prototype
├── location-based-login/  # standalone login page
├── *.md                   # database schema documentation
└── vercel.json            # points at ai-ms-app
```

`.kilo/` and `.kilocode/` hold agent tooling and git worktrees — ignore them
when reading the tree.

---

## Contributing

1. Work in the module you own; modules do not share code.
2. Database changes go in `front-desk-app/supabase/migrations/` as a new
   timestamped `YYYYMMDDNNN_NNNNN_description.sql` file.
3. Update the AI registry (`ai-ms-app/app/erp_schema.py`) when you add or
   rename a table.
4. Run the module's lint and build before opening a PR.

## License

Proprietary — Vector Advert.