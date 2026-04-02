# 03 — Frontend (React)

The Forge frontend is a React 18 SPA (Single Page Application) with TypeScript,
Vite, and Tailwind CSS. It lives in `forge/ui_next/`.

---

## Tech Stack

| Tool | Why it was chosen |
|------|-------------------|
| React 18 | Component model, hooks, wide ecosystem |
| TypeScript | Catches errors before runtime |
| Vite 6 | Fast dev server (~50ms HMR), ESM-native |
| Tailwind CSS 3 | Utility-first, no separate CSS files per component |
| TanStack Query 5 | Server state: caching, dedup, background refetch |
| Zustand 4 | Client state: minimal, no boilerplate |
| React Router 7 | Standard React routing |
| Recharts | Dashboard charts |
| XYFlow | Workflow DAG visualization |
| Monaco Editor | YAML/JSON editor with syntax highlighting |
| XTerm | Job output terminal display |
| Vitest | Tests — Vite-native, fast, Jest-compatible |

---

## Project Structure

```
forge/ui_next/
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Dev server, build, proxy
├── tsconfig.json           # TypeScript configuration (strict mode)
├── tailwind.config.ts      # Tailwind theme
│
└── src/
    ├── main.tsx            # Entry point: QueryClient, Router, ErrorBoundary
    ├── App.tsx             # Auth check, routing
    ├── index.css           # Tailwind + CSS variables (light/dark theme)
    │
    ├── api/
    │   ├── client.ts       # Axios instance: CSRF, session auth, 401 interceptor
    │   ├── types.ts        # TypeScript interfaces for ALL API resources
    │   └── hooks/          # TanStack Query hooks (23 files, one per resource)
    │
    ├── stores/
    │   ├── auth.ts         # Zustand: user, isAuthenticated
    │   └── theme.ts        # Zustand: light/dark theme (persisted in localStorage)
    │
    ├── components/
    │   ├── ui/             # Primitive components (Button, Card, Input, Badge...)
    │   ├── layout/         # AppLayout, Sidebar, TopBar
    │   ├── skeletons/      # Loading skeletons for every page
    │   ├── job/            # Job-specific (output tab, host summary)
    │   ├── workflow/       # Workflow visualizer (XYFlow)
    │   ├── schedule/       # RRule editor for schedules
    │   └── survey/         # Survey editor for templates
    │
    ├── pages/              # Pages (~40 files)
    │   ├── Dashboard.tsx, Login.tsx, Jobs.tsx, Templates.tsx...
    │   └── NotFound.tsx
    │
    ├── hooks/
    │   └── useWebSocket.ts # Real-time job status updates
    │
    ├── lib/
    │   ├── utils.ts        # cn(), formatDuration(), formatRelativeTime()
    │   └── statusConfig.ts # Job status → badge variant/icon mapping
    │
    └── locales/
        └── en.json         # i18n translations (English)
```

---

## Development Workflow

### Starting the dev server

```bash
cd forge/ui_next
npm ci            # install dependencies
npm run dev       # dev server at http://localhost:5173
```

The dev server automatically proxies API requests to the Django backend:
- `/api/*` → `http://localhost:8013`
- `/sso/*` → `http://localhost:8013`
- `/websocket/*` → `ws://localhost:8013`

### Production build

```bash
npm run build
# Output: forge/ui_next/build/forge/
# - index_forge.html (renamed from index.html)
# - assets/ (JS, CSS chunks)
```

Django serves `index_forge.html` through `TemplateView`, and static assets
from `/static/forge/assets/`.

### Lint and type-checking

```bash
npx tsc --noEmit   # TypeScript check (no JS output)
npm test            # Vitest tests
```

---

## Key Patterns

### Server State: TanStack Query

All API data is fetched and cached through TanStack Query hooks in `src/api/hooks/`.
Each resource has its own file: `useJobs.ts`, `useTemplates.ts`, `useProjects.ts`, etc.

**Watch out:**
- Default staleTime is **30 seconds** — queries won't refetch while fresh
- Retry: **1x** — after two failures, shows error
- Refetch on window focus: **disabled** — won't send requests when switching tabs
- Mutation errors automatically go to `toast.error` — no manual handling needed

### Client State: Zustand

Only two global stores:
- **auth** — user object and isAuthenticated flag
- **theme** — light/dark theme, persisted in localStorage

Everything else comes from the server via TanStack Query. No Redux, no Context
for data.

### Real-Time Updates: WebSocket

The `useWebSocket` hook connects to `/websocket/` and listens for job status changes.
When an event arrives, it invalidates the relevant TanStack Query caches, which triggers
a refetch and the UI updates automatically.

**Watch out:** WebSocket uses exponential backoff for reconnection (1s → 30s max).
If WebSocket isn't working, the UI won't update in real-time — users must manually
refresh the page.

---

## Components — Where to find things

### UI Primitives (`components/ui/`)

shadcn/ui style — each component is a small file with Tailwind classes.
Button, Card, Input, Select, Dialog, Badge, Skeleton, Switch, Checkbox...

**Watch out:** Use the `cn()` utility for merging Tailwind classes — it properly
handles conflicts (e.g., `cn('p-4', 'p-2')` gives `'p-2'`, not `'p-4 p-2'`).

### Layout (`components/layout/`)

- **AppLayout** — 2-column: sidebar + main content. Sidebar hides on mobile.
- **Sidebar** — Navigation with 4 groups: Views, Resources, Access, Admin
- **TopBar** — Page title, theme toggle, user menu

### Pages (`pages/`)

Each page corresponds to one route. They follow the pattern:
1. Fetch data with a hook
2. Show skeleton while loading
3. Show error if it fails
4. Render table/form/detail

### Advanced Components

| Component | What it does | When it's used |
|-----------|-------------|----------------|
| `LaunchDialog` | Override template parameters at launch + render survey questions with dynamic choices | When template has `ask_*_on_launch` flags or `survey_enabled` |
| `WorkflowVisualizer` | XYFlow DAG editor | Workflow template creation/editing |
| `RRuleEditor` | Visual builder for iCal recurrence | Schedule creation/editing |
| `SurveyEditor` | CRUD for survey questions with dynamic choices configuration | Template survey definition |
| `CodeEditor` | Monaco editor (lazy-loaded) | Extra vars, variables editing |
| `RBACPanel` | Role assignment UI | Assigning permissions to users/teams |

---

## Theming (Light/Dark)

CSS variables in `src/index.css` define colors for both themes. Dark mode is activated
by adding the `dark` class to the `<html>` element.

The theme is stored in localStorage under the key `forge-theme`.

**Watch out:** When adding a new component, use semantic colors
(`bg-background`, `text-foreground`, `border-border`) instead of hardcoded ones
(`bg-white`, `text-black`). This way it will automatically work in both themes.

---

## Routing — All routes

```
/login                          Login page
/dashboard                      Dashboard (default)
/jobs                           Job list
/jobs/:id                       Job detail (output, details, hosts)
/templates                      Job + Workflow template list
/templates/job_template/new     Create job template
/templates/job_template/:id/edit
/templates/workflow_job_template/new
/templates/:type/:id            Template detail
/projects                       Project list (+ /new, /:id, /:id/edit)
/inventories                    Inventory list (+ /new, /:id, /:id/edit)
/credentials                    Credential list (+ /new, /:id, /:id/edit)
/organizations                  Organization list (+ /new, /:id, /:id/edit)
/users                          User list (+ /new, /:id, /:id/edit)
/teams                          Team list (+ /new, /:id, /:id/edit)
/hosts                          Global host list
/hosts/:id                      Host detail
/schedules                      Schedule list
/instances                      Cluster nodes
/instance_groups                Instance groups
/execution_environments         Execution environments
/notification_templates         Notifications (+ /new, /:id/edit)
/topology                       Network topology
/settings                       Settings (categories)
/settings/:slug                 Settings detail
/activity                       Activity stream (audit log)
*                               404 Not Found
```

---

## Code Splitting

Vite automatically splits the bundle into chunks:

| Chunk | Contains | Loaded when... |
|-------|----------|---------------|
| `vendor-react` | React, ReactDOM, Router | Always (core) |
| `vendor-query` | TanStack Query/Table | Always (data fetching) |
| `vendor-xyflow` | XYFlow | User opens a workflow page |
| `vendor-rrule` | RRule | User opens the schedule editor |
| `vendor-charts` | Recharts | User opens the dashboard |
| `vendor-xterm` | XTerm | User opens job output |

**Watch out:** Monaco Editor is lazy-loaded — so initial page load
won't be slow even with the large editor in the bundle.

---

## i18n

Currently English only (`src/locales/en.json`). The infrastructure supports
multilingual — add `de.json`, `fr.json`, etc. and register them in `src/i18n.ts`.

---

## Error Handling

Two levels of error boundaries:
1. **Outer** (in `main.tsx`) — catches fatal errors in the entire application
2. **Inner** (in `AppLayout.tsx`, keyed on `location.pathname`) — catches errors
   per route. Navigating to another page clears the error state.

API errors are automatically displayed as toast notifications.

---

## Watch Out — Common Mistakes

1. **Forgotten cache invalidation:** After a mutation (POST/PATCH/DELETE),
   always call `queryClient.invalidateQueries()` so the list refreshes.

2. **CSRF token:** The Axios interceptor automatically reads the `csrftoken` cookie
   and sends it as an `X-CSRFToken` header. If you get a 403, check that the cookie is present.

3. **Type safety:** `tsconfig.json` is in strict mode — every variable must
   have a type. Don't use `any` unless absolutely necessary.

4. **Path alias:** `@/` maps to `./src/` — use `import { Button } from '@/components/ui/button'`
   instead of relative paths with `../../..`.
