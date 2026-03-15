# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Progress Tracker App — a web app for tracking multi-stage workflows (job hunting, apartment hunting, etc.). Built with Next.js + TypeScript, SQLite + Drizzle ORM, Tailwind CSS, shadcn/ui, and Framer Motion. No separate backend server; all backend logic lives in Next.js API routes.

## Commands

Once scaffolded (Phase 1 not yet complete):

```bash
npm install          # Install dependencies
npm run db:migrate   # Run database migrations
npm run dev          # Start development server
```

Database file lives at `./data/progress.db` (local SQLite).

## Architecture

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

### API Routes (Phase 2)

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

## Build Order

The project follows a phased approach tracked in README.md:
- **Phase 1** (Foundation): Next.js scaffold, Tailwind, shadcn/ui, Drizzle schema
- **Phase 2** (Backend): API routes
- **Phase 3** (Core UI): App shell, dashboard, cards, detail view, quick-add modal
- **Phase 4** (Polish): Tips, staleness alerts, reminders, Framer Motion transitions
- **Phase 5** (Future): Cloud sync (Turso/Supabase), Vercel deploy, mobile, push notifications
