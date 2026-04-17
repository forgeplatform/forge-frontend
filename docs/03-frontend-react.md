# 03 — Frontend (React)

The Forge frontend is a React 18 SPA (Single Page Application) with TypeScript,
Vite, and Tailwind CSS. It lives in the `forge-frontend` repository.

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
forge-frontend/
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
cd forge-frontend
npm ci            # install dependencies
npm run dev       # dev server at http://localhost:5173
```

The dev server automatically proxies API requests to the Django backend:
- `/api/*` → `http://localhost:8013`
- `/sso/*` → `http://localhost:8013`
- `/websocket/*` → `ws://localhost:8013`
- `/assistant/*` → `http://localhost:8100` (Forge Assistant AI service)

### Production build

```bash
npm run build
# Output: build/forge/
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
| `WorkflowLaunchDialog` | Multi-step launch dialog for workflows with per-node surveys | Workflow launch when surveys are enabled |
| `CodeEditor` | Monaco editor (lazy-loaded) | Extra vars, variables editing |
| `RBACPanel` | Role assignment UI | Assigning permissions to users/teams |
| `AuditLog` | Immutable security audit log with filters, expandable rows, CSV export | `/audit` route — credential access, auth events, permission changes |
| `AssistantPanel` | Floating AI chat panel with SSE streaming, page context awareness | Always visible (bottom-right button) when forge-assistant service is healthy |
| `RecommendationsPanel` | Rule-based actionable suggestions for the current page | Dashboard and wizard pages |
| `ServiceRequestDialog` | Self-service catalog request form with approval workflow | Service portal pages |
| `SurveyQuestionInput` | Dynamic survey question renderer (supports db query, API, Jinja2 choices) | Launch dialogs when `survey_enabled` is true |

### AI Assistant (`components/assistant/`)

The `AssistantPanel` is a floating chat component that connects to the Forge Assistant
microservice (port 8100) via Server-Sent Events (SSE). It sends the current page context
(route path) alongside user messages so the AI can provide contextual answers.

- **API hook:** `src/api/hooks/useAssistant.ts`
- **Detection:** The frontend polls `/assistant/api/v1/health` on mount. If the endpoint
  responds, the chat button appears. If forge-assistant is not deployed, no UI is shown.
- **Proxy:** In development, Vite proxies `/assistant/*` to `http://localhost:8100` with
  path rewrite (`/assistant/api/...` → `/api/...`).

### Wizards (`components/wizard/`)

A guided setup system with 7 specialized wizards:

| Wizard | Purpose |
|--------|---------|
| `GettingStartedWizard` | Initial platform setup (credentials, project, inventory, template) |
| `AutomationWizard` | Create a complete automation from scratch |
| `SelfServiceWizard` | Publish a template to the self-service catalog |
| `ResourcesWizard` | Bulk create projects, inventories, credentials |
| `AccessWizard` | Set up users, teams, and RBAC permissions |
| `TenancyWizard` | Configure multi-tenant organizations with quotas and branding |
| `ComplianceWizard` | Set up drift detection, policies, and scanners |

The wizard framework (`Wizard.tsx`, `useWizardState.ts`, `fields.tsx`, `ReviewStep.tsx`,
`StepIndicator.tsx`) provides a multi-step form with validation, navigation, and a
final review step before submission.

### Recommendations (`components/wizard/RecommendationsPanel.tsx`)

Displays rule-based recommendations from the backend (`GET /api/v2/recommendations/`).
The recommendations engine evaluates 12 built-in rules and suggests actionable
improvements (e.g., "Enable SCM update on launch for Project X"). No database tables
are needed — the engine is stateless and reads the current configuration to generate suggestions.

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
/audit                          Audit log (immutable security events)

# Event-Driven Automation
/event_rules                    Event rules list (+ /new, /:id, /:id/edit)
/event_logs                     Event logs (webhook receive history)
/event_logs/:id                 Event log detail (payload, conditions, actions)
/outbound_webhooks              Outbound webhooks (+ /new, /:id, /:id/edit)

# Drift Detection (Compliance)
/drift_detections               Drift list (filter by category, severity, acknowledged)
/drift_detections/:id           Drift detail (before/after diff, acknowledge)
/drift_alert_rules              Alert rules list (+ /new, /:id, /:id/edit)
/drift_alerts                   Triggered alerts (notification status)
/drift_alerts/:id               Alert detail (summary, notification error)
/fact_snapshots                 Host fact snapshots (browse by host/job)

# Analytics
/analytics                      Automation analytics dashboard (trends, coverage, time savings)

# Account security (OIDC + WebAuthn)
/me/security                    FIDO2 credential management (register, rename, delete)
/auth/mfa                       Post-primary-auth WebAuthn assertion interstitial

# Policy-as-Code (OPA)
/policies                       Policy list with enabled toggle and sync status
/policies/new                   New policy form (Rego editor + dry run)
/policies/:id/edit              Edit policy
/policy_decisions               Policy decision audit log

# IaC Scanning & Supply Chain Security
/scanners                       Scanner list (tool badge, severity threshold, enforcement, last run status, enable toggle)
/scanners/new                   New scanner form (tool dropdown, severity threshold, enforcement, applies_to, JSON config editor)
/scanners/:id/edit              Edit scanner
/scan_results                   Scan result audit log with finding drawer (filter: status, scanner, since)

# Observability (Tier 3.6)
/observability                  Read-only OpenTelemetry panel: enabled state, service name, exporter endpoint, sampler + ratio, Collector health badge (green/red) with last-check timestamp, and a short "how to view traces" note pointing at the deploy docs. Sidebar entry lives under the Compliance group (Activity icon from lucide-react). Backed by `GET /api/v2/observability/` via `useObservability()`.

# Multi-Tenancy (Tier 3.2)
/tenants                        Tenant orgs list: usage bars (concurrent jobs, daily launches, hosts, storage) with X/Y progress, branding preview (logo + color swatches), custom domain, actions. Backed by `useTenants()`.
/tenants/new                    Create tenant form: name, contact email, admin user (username/email/password), quota inputs (empty = unlimited), branding section (logo URL, primary/secondary hex color picker, custom domain). POST `/api/v2/tenants/` provisions Org + admin + team + TenantUsage atomically.
/tenants/:id                    Tenant detail: usage charts, recent quota events, recalculate button, danger-zone delete with confirmation modal.
/tenants/:id/edit               Edit tenant (quotas + branding; admin user fields are create-only).
/tenant_quota_events            Quota audit log filterable by organization / quota_kind / decision / since.

Sidebar NEW group **Tenancy** above the Compliance group, with `Building2` (Tenants) and `Activity` (Quota Events) icons.

**Boot-time branding** (`src/branding/applyBranding.ts`): called from `src/main.tsx` **before** React mounts. Reads localStorage for a cached `forge.branding` entry (TTL 5 min); on miss, fetches `/api/v2/branding/?host=${window.location.hostname}` with no auth / no credentials. On success, sets CSS variables `--forge-primary` and `--forge-secondary` on `:root`, updates the document title, and swaps the favicon. Cached for 5 minutes to keep cold-load under the fetch time. Tailwind exposes these CSS vars as `colors.brand.primary` / `colors.brand.secondary`. The branding endpoint is **public** on the backend so the skin applies before the login screen.

# Self-Service Portal
/service_portal                 Catalog browse (cards by category, request dialog)
/my_requests                    End-user request inbox (status filter)
/service_requests/:id           Request detail (audit, approve/reject)
/service_approvals              Approver inbox (filtered to caller's authority)
/service_catalog                Admin CRUD list of catalog items
/service_catalog/new            Create catalog item form
/service_catalog/:id/edit       Edit catalog item form

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
