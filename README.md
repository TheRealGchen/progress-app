# Progress Tracker App

A progress tracking app for multi-stage processes like job hunting, apartment hunting, and similar workflows. Tracks multiple items through configurable stages, surfaces tips/reminders at each stage, and is designed for future cloud sync.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js + TypeScript | Full-stack, routing, industry standard |
| Styling | Tailwind CSS | Utility-first, co-located styles |
| Components | shadcn/ui | Composable, Radix-based, polished |
| Animations | Framer Motion | Transitions and stage movement polish |
| Database | SQLite + Drizzle ORM | Local-first, typed, easy to migrate |
| Cloud sync (future) | Turso or Supabase | SQLite-compatible or Postgres |
| Deployment (future) | Vercel | Natural Next.js home |

**No separate backend server** — Next.js API routes handle all backend logic.

---

## UX Design Decisions

### No drag-and-drop
Stage progression is done via a **status pill** on the card (clickable to advance) and a **"Move to next stage"** button in the detail view. No Kanban drag-and-drop.

### Entry creation
Minimal quick-add form — only required fields upfront:
- Company/Property Name (required)
- Role/Unit Title (required)
- URL (optional)
- Priority (Low / Medium / High)
- Source (e.g. LinkedIn, Referral, Company Site)

Drops into the pipeline at stage **"Saved / Researching"** with auto-timestamp.

### Stage progression flow
1. Click status pill or "Move to next stage"
2. Timestamp recorded automatically
3. A **contextual prompt** slides in for that stage's optional fields (dismissable, can fill later)
4. A **tip card** surfaces relevant to the new stage

### Stage-specific fields (unlock dynamically per stage)

| Stage | Fields |
|---|---|
| Saved | Notes |
| Applied | Date applied, method, contact name |
| Phone Screen | Scheduled datetime, recruiter name, prep notes |
| Interview | Round # (auto-increments), format, interviewer names |
| Offer | Amount, deadline, equity/benefits notes |
| Closed | Outcome (accepted / rejected / withdrew / ghosted), reason |

### Flexibility
- **Extra interview rounds** via "Add Round" — not a forced linear step
- **Skip stages** — jump straight to Offer etc.
- **Custom stages** per entry via "+ Add Stage"
- **Reopen closed entries**
- **Staleness alerts** — badge if no update in X days
- **Per-stage reminders** — optional dated reminder per stage

### Card detail view (timeline layout)
```
◉ Saved          Mar 1   "Found on LinkedIn"
◉ Applied        Mar 3   Applied via company site · Contact: Sarah H.
◉ Phone Screen   Mar 8   30 min with recruiter
◯ Interview              ← current stage, fields ready to fill
◯ Offer
◯ Closed
```
Plus a persistent **freeform notes / activity log** at the bottom, timestamped.

---

## Data Model (Planned)

### `tracker_types`
Defines a category of tracking (e.g. "Job Hunt", "Apartment Hunt")
- id, name, default_stages (JSON array)

### `entries`
A single thing being tracked (e.g. one job application)
- id, tracker_type_id, title, company, url, priority, source, created_at, archived_at

### `stages`
The stages an entry moves through
- id, entry_id, name, position, entered_at, custom (bool)

### `stage_fields`
Dynamic field values per stage
- id, stage_id, field_key, field_value

### `notes`
Freeform timestamped notes per entry
- id, entry_id, body, created_at

### `reminders`
Per-stage optional reminders
- id, stage_id, remind_at, dismissed_at

---

## TODO — Build Order

### Phase 1: Foundation
- [ ] Initialize Next.js project (`npx create-next-app@latest`)
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Install Drizzle ORM + better-sqlite3
- [ ] Define database schema and run initial migration

### Phase 2: Backend (API Routes)
- [ ] `GET/POST /api/entries` — list and create entries
- [ ] `GET/PUT/DELETE /api/entries/[id]` — single entry operations
- [ ] `POST /api/entries/[id]/advance` — advance to next stage
- [ ] `GET/POST /api/entries/[id]/notes` — notes log
- [ ] `POST /api/entries/[id]/stages` — add custom stage
- [ ] `GET /api/tracker-types` — list tracker type templates

### Phase 3: Core UI
- [ ] App shell — sidebar nav, main content area
- [ ] Home / dashboard — list of all active entries grouped by tracker type
- [ ] Entry card — status pill, stage label, staleness indicator
- [ ] Entry detail view — vertical timeline, stage fields, notes log
- [ ] Quick-add form modal
- [ ] Stage advance flow — contextual prompt + tip card

### Phase 4: Polish
- [ ] Tip/reminder content per stage per tracker type
- [ ] Staleness alert logic
- [ ] Per-stage reminder scheduling (local)
- [ ] Framer Motion transitions on stage advance
- [ ] Empty states and onboarding

### Phase 5: Future
- [ ] Cloud sync via Turso or Supabase
- [ ] Deploy to Vercel
- [ ] Mobile-responsive layout
- [ ] Push notifications for reminders

---

## Setup (once scaffolded)

```bash
npm install
npm run db:migrate
npm run dev
```

Database file will live at `./data/progress.db` (local SQLite).
