# GrowEasy AI CSV Importer

An AI-powered CRM lead importer. Upload a lead CSV in almost any shape (Facebook or Google Ads exports, Excel dumps, agency sheets, hand-made spreadsheets) and the app maps its columns into clean GrowEasy CRM records, showing you exactly what was imported, what was skipped, and why.

**Position applied for:** Full-Time

**Live app:** `<your-vercel-url>`
**Repository:** `<your-github-url>`

---

## Table of contents

- [What it does](#what-it-does)
- [How it works: the AI pipeline](#how-it-works-the-ai-pipeline)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Running it](#running-it)
- [CRM schema and extraction rules](#crm-schema-and-extraction-rules)
- [API reference](#api-reference)
- [Error reference](#error-reference)
- [AI throughput and rate limits](#ai-throughput-and-rate-limits)
- [Testing](#testing)
- [Deployment](#deployment)
- [Edge cases handled](#edge-cases-handled)
- [Bonus features](#bonus-features)
- [Known limitations](#known-limitations)

---

## What it does

1. **Upload** a CSV by drag-and-drop or file picker (`.csv`, up to 5MB).
2. **Preview** the raw rows instantly in a scrollable table. No AI runs yet.
3. **Confirm** to send the file to the backend.
4. **Watch** live progress stream in while the AI processes rows in batches.
5. **Review** the result: imported records styled like the GrowEasy CRM, plus a skipped list that tells you the reason for every dropped row, plus a panel showing how the AI mapped your columns.

The interface is built to match the GrowEasy product so the importer feels like a native feature rather than a separate tool.

---

## How it works: the AI pipeline

The hard part of this assignment is not parsing CSV. It is mapping unpredictable columns into a fixed CRM schema reliably. The pipeline does that in four stages, and only two of them call the AI. Everything the AI returns is re-checked by deterministic code, so the output can never violate the schema even if the model misbehaves.

**Phase 0: Deterministic parse (no AI).**
The CSV is parsed with a robust parser that strips the byte-order mark, auto-detects the delimiter, honors quoted fields containing commas and newlines, trims values, and drops fully empty rows.

**Phase 1: Header inference (one AI call per file).**
The column headers plus a few sample rows are sent to the model once. It returns a mapping plan: which source columns feed which CRM field, with a confidence level and a short rationale. This is cheap regardless of file size and is surfaced to the user in the "How we read your file" panel for transparency.

**Phase 2: Batch extraction (AI, the real conversion).**
Rows are split into batches and sent to the model with the Phase 1 mapping as guidance, plus the full extraction rules. Batches run through a bounded worker pool, paced under the AI provider's rate limit. Any batch that fails is retried with exponential backoff that honors the server's retry delay; a batch that still fails has its rows skipped with a clear reason rather than crashing the whole import.

**Phase 3: Validation (no AI).**
Every record the model returns is re-validated. Status and data-source values that are not in the allowed set are coerced to blank, dates that JavaScript cannot parse are blanked, and real newlines are escaped so each record stays a single CSV row. Records with neither an email nor a mobile number are moved to the skipped list. This layer is what actually guarantees correctness.

Successful records, skipped rows, and the mapping are then persisted to Supabase and returned to the frontend.

---

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, `@tanstack/react-virtual` for the virtualized results table.
- **Backend:** Node.js, Express, TypeScript, Multer (upload), PapaParse (parsing), Zod (validation).
- **AI:** Google Gemini (Developer API). The model is configurable; the client is isolated in one file so the provider can be swapped.
- **Database:** Supabase (Postgres). Optional at runtime; the pipeline works without it and simply skips persistence.
- **Shared:** a `@groweasy/shared` package holding the types, enums, and Zod schemas used by both apps.

---

## Project structure

```
groweasy-csv-importer/
  apps/
    api/                      Express backend
      src/
        ai/                   Gemini client + prompts + Phase 1/2 services
        services/             csv, validation, import orchestrator, supabase
        routes/               /api/import, /api/sample, /api/health
        middleware/           central error handler
        utils/                retry, concurrency, rate limiter, json extract
        config/               env parsing and validation
    web/                      Next.js frontend
      app/                    layout + main page
      components/             shell, import flow, results, ui primitives
      hooks/useImport.ts      import state machine
      lib/                    api client (SSE) + client-side preview parse
  packages/
    shared/                   CrmRecord type, enums, Zod schemas (source of truth)
  supabase/
    migrations/0001_init.sql  imports, leads, skipped_rows tables
```

---

## Local setup

**Prerequisites:** Node.js 18 or newer, and a Google AI Studio API key (free, no card required, from [aistudio.google.com](https://aistudio.google.com)).

```bash
# 1. Install everything (this is a monorepo; install once from the root)
npm install

# 2. Configure the backend
cp .env.example apps/api/.env
# then open apps/api/.env and paste your key into GEMINI_API_KEY

# 3. Configure the frontend
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" > apps/web/.env.local

# 4. (Optional) enable persistence
#    In your Supabase project SQL editor, run supabase/migrations/0001_init.sql,
#    then add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to apps/api/.env
```

---

## Environment variables

All backend variables live in `apps/api/.env`. Defaults are sensible, so only `GEMINI_API_KEY` is strictly required to run.

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | (required) | Google AI Studio key. Without it, imports fail with a clear error. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model to use. `gemini-2.5-flash-lite` has higher free-tier limits. |
| `AI_BATCH_SIZE` | `40` | Rows per AI request. Larger means fewer requests. |
| `AI_MAX_CONCURRENCY` | `3` | Batches processed in parallel. |
| `AI_MAX_RETRIES` | `5` | Retries per AI call on 429 / 5xx / network errors. |
| `AI_MIN_REQUEST_INTERVAL_MS` | `4000` | Minimum gap between AI calls, to stay under the free-tier rate limit. Set to `0` on a paid key. |
| `MAX_FILE_SIZE_MB` | `5` | Upload size cap. |
| `PORT` | `4000` | Backend port. Hosting providers usually inject this. |
| `FRONTEND_ORIGIN` | `*` | CORS allow-list. Set to your deployed frontend URL in production. |
| `SUPABASE_URL` | empty | Supabase project URL. Persistence is skipped if empty. |
| `SUPABASE_SERVICE_ROLE_KEY` | empty | Supabase service role key. Server-side only. |

Frontend, in `apps/web/.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend, no trailing slash. |

---

## Running it

Two terminals:

```bash
npm run dev:api    # backend on http://localhost:4000
npm run dev:web    # frontend on http://localhost:3000
```

Open `http://localhost:3000` and import a file. Sample CSVs (including messy exports and a large file) are in `apps/api/samples/`.

Production build:

```bash
npm run build      # builds shared, then api (tsup), then web (next build)
```

---

## CRM schema and extraction rules

Each imported record has these fields: `created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`.

The AI is instructed and the validation layer enforces:

- **`crm_status`** must be one of `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`. Free text is normalized (for example "closed won" becomes `SALE_DONE`); anything unclear is left blank.
- **`data_source`** must be one of `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`, else blank.
- **`created_at`** is reformatted to a value JavaScript's `new Date()` can parse; anything unparseable is blanked rather than dropping the record.
- **Multiple emails or phones:** the first goes in the dedicated field, the rest are appended to `crm_note`.
- **CSV safety:** newlines inside any value are escaped so a record never breaks into multiple rows.
- **Skip rule:** a row with neither an email nor a mobile number is skipped.

---

## API reference

**`GET /api/health`** — liveness check. Returns `{ "status": "ok", "time": "..." }`.

**`GET /api/sample`** — downloads a sample CRM CSV template.

**`POST /api/import`** — the import endpoint. Send `multipart/form-data` with a `file` field.
- By default it streams Server-Sent Events: `parsed`, `mapping`, `batch` (progress), then `done` with the full result, or `error`.
- Add `?stream=0` for a single buffered JSON response instead (handy for `curl` and tests).

Example:

```bash
curl -X POST "http://localhost:4000/api/import?stream=0" \
  -F "file=@apps/api/samples/sales-report.csv"
```

The result payload contains `importId`, `filename`, `mapping`, `records`, `skipped` (each with a `reason`), and `totals`.

---

## Error reference

Every error the app can show, what it means, and how to resolve it.

**Errors shown in the upload dialog:**

| Message | Meaning | Fix |
|---|---|---|
| Please upload a .csv file. | The selected file is not a `.csv`. | Choose a CSV file. |
| That file is larger than the 5MB limit. | Upload exceeds the size cap. | Split the file or raise `MAX_FILE_SIZE_MB`. |
| This CSV does not contain any data rows. | The file has headers but no data, or is empty. | Add data rows. |

**Errors shown on the processing screen:**

| Message | Meaning | Fix |
|---|---|---|
| The AI could not process any batch... | Every AI batch failed. Usually a missing or invalid API key, an exhausted quota, or the model being unavailable. | Check `GEMINI_API_KEY`, wait for the quota to reset, or switch model. |
| Import failed (HTTP 4xx/5xx) | The backend rejected the request or errored. | See the backend logs; the message usually names the cause. |
| Failed to fetch / network error | The frontend cannot reach the backend. | Confirm the API is running and `NEXT_PUBLIC_API_BASE_URL` is correct. |

**Backend responses (visible in logs or via `curl`):**

| Status | Message | Meaning |
|---|---|---|
| 400 | No file uploaded. Use form field 'file'. | No file part in the request. |
| 400 | Only .csv files are accepted | Wrong file type reached the server. |
| 413 | Upload error: File too large | File exceeded the size limit. |
| 500 | Internal server error | Unexpected server error; check logs. |

**Per-row skip reasons (shown in the Skipped tab, not failures):**

| Reason | Meaning |
|---|---|
| No email or mobile number present | The row had no usable contact, so it was skipped by rule. |
| AI extraction failed for this row's batch after retries | This row's batch could not be processed even after retries; the rest of the import still succeeded. |
| Validation failed: ... | The AI returned something the schema could not accept. Rare, since most invalid values are coerced rather than rejected. |

A skipped row is expected behavior, not a crash. The counts and reasons are shown so the import stays transparent.

---

## AI throughput and rate limits

The app runs on the Gemini free tier by default, which is rate limited (roughly 10 to 15 requests per minute and a daily request cap, depending on the model). To respect this, the backend paces its calls (`AI_MIN_REQUEST_INTERVAL_MS`) and retries rate-limit errors with backoff.

Practical implications:

- Typical lead lists (tens to a few hundred rows) import quickly and completely.
- Very large files (thousands of rows) will import successfully but slowly, because pacing keeps requests under the quota. This is a free-tier constraint, not a code limit.
- On a paid key, set `AI_MIN_REQUEST_INTERVAL_MS=0` and raise `AI_MAX_CONCURRENCY` for full speed.
- `gemini-2.5-flash-lite` offers higher free-tier limits than `gemini-2.5-flash`, at a small cost to mapping quality.

Daily quotas reset at midnight Pacific Time.

---

## Testing

```bash
npm test -w @groweasy/api
```

The suite covers CSV parsing edge cases (BOM, quoted commas and newlines, empty rows), the validation layer (enum coercion, date handling, newline escaping, the skip rule, failed-batch handling), the rate limiter's pacing, and a full pipeline run with the AI mocked.

---

## Deployment

**Backend on Render** (Node web service):
- Build: `npm install --include=dev && npm run build -w @groweasy/api`
- Start: `node apps/api/dist/index.js`
- The `--include=dev` flag is required because the build tool is a dev dependency and Render builds in production mode by default.
- Set `GEMINI_API_KEY`, `GEMINI_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. `PORT` is injected by Render.

**Frontend on Vercel:**
- Set the project root to `apps/web`.
- Set `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL.

**After both are live**, set `FRONTEND_ORIGIN` on the backend to your Vercel URL and redeploy so only your site can call the API.

Note: on Render's free tier the backend sleeps after inactivity, so the first request after idle takes 30 to 60 seconds to wake it.

---

## Edge cases handled

Byte-order mark at the start of a file; alternate delimiters; commas and newlines inside quoted fields; escaped quotes; duplicate header names (auto-renamed, both kept); entirely empty rows; multiple emails or phones in one cell; mixed and natural-language date formats; rows with no contact information; a valid CSV with zero data rows; and malformed JSON from the model (repaired or retried).

---

## Bonus features

Drag-and-drop upload; live progress via Server-Sent Events; retry with backoff for failed AI batches; a virtualized results table for large imports; dark mode; unit tests; a column-mapping transparency panel; and optional Supabase persistence of every import.

---

## Known limitations

- Large imports are throughput-bound by the AI free tier, as described above.
- Mapping quality depends on the chosen model; `flash-lite` trades some accuracy for higher limits.
- Persistence is fire-and-forget: a Supabase write failure is logged but never blocks the import result.