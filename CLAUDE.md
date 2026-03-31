# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Progress Tracker App — a web app for tracking multi-stage workflows (job hunting, apartment hunting, etc.). Built with Next.js + TypeScript, libSQL/Turso + Drizzle ORM, Tailwind CSS, shadcn/ui, and Framer Motion. No separate backend server; all backend logic lives in Next.js API routes.

Phases 1–3 are complete. Phase 4 (polish) is in progress. Phase 5 deployment is done (Vercel + Turso).

## Commands

```bash
npm install          # Install dependencies
npm run db:migrate   # Run database migrations
npm run dev          # Start development server
```

In development, the database falls back to a local SQLite file at `./data/progress.db` when `TURSO_DATABASE_URL` is not set.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `TURSO_DATABASE_URL` | Turso DB URL (`libsql://your-db.turso.io`) | Production only |
| `TURSO_AUTH_TOKEN` | Turso auth token | Production only |

For local dev, no env vars needed. For production (Vercel), set both in the Vercel project dashboard.

## Architecture

### Database

Uses `@libsql/client` + `drizzle-orm/libsql`. The `db/index.ts` client reads `TURSO_DATABASE_URL` and falls back to `file:./data/progress.db` when unset — so the same code works in both dev and prod.

`next.config.ts` marks `@libsql/client` as a `serverExternalPackage` so Next.js doesn't try to bundle it.

### Data Model

| Table | Key columns |
|---|---|
| `tracker_types` | id, name, default_stages (JSON array) |
| `entries` | id, tracker_type_id, title, company, url, priority, source, created_at, archived_at |
| `stages` | id, entry_id, name, position, entered_at, custom (bool) |
| `stage_fields` | id, stage_id, field_key, field_value |
| `notes` | id, entry_id, body, created_at |
| `reminders` | id, stage_id, remind_at, dismissed_at |

`stage_fields` stores dynamic per-stage data that unlocks as entries progress (e.g., recruiter name at Phone Screen, offer amount at Offer stage).

### API Routes

- `GET/POST /api/entries` — list and create entries
- `GET/PUT/DELETE /api/entries/[id]` — single entry operations
- `POST /api/entries/[id]/advance` — advance to next stage (auto-timestamps, triggers tip card)
- `GET/POST /api/entries/[id]/notes` — freeform notes log
- `POST /api/entries/[id]/stages` — add custom stage
- `GET /api/tracker-types` — list tracker type templates

### Stage Progression Flow

Stage advancement is intentionally **not drag-and-drop**. The flow is:
1. User clicks status pill on card or "Move to next stage" in detail view
2. Timestamp recorded automatically
3. Contextual prompt slides in for that stage's optional fields (dismissable)
4. Tip card surfaces relevant to the new stage

### Entry Detail View

Vertical timeline layout showing completed stages with timestamps + fields, current stage with fillable fields, and future stages. A persistent freeform notes/activity log sits at the bottom.

## Build Status

- **Phase 1** (Foundation): ✅ Complete
- **Phase 2** (Backend): ✅ Complete
- **Phase 3** (Core UI): ✅ Complete
- **Phase 4** (Polish): 🚧 In progress — tips, staleness alerts, reminders, Framer Motion
- **Phase 5** (Deployment): ✅ Vercel + Turso configured; mobile + push notifications remaining
