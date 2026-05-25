# ReviewPulse — Feature & surface catalog

This document is the **source of truth** for shipped surfaces (UI), integration points, API routes, and operational hooks. Implementation details live in referenced files; MVP narrative is in **`IMPLEMENTATION_GUIDE.md`** at repo root.

## Product pillars

| Area | Purpose |
|------|---------|
| **Review intelligence** | Inbox, sentiment, themes, multilingual context, predictive signals |
| **Response ops** | AI drafts, tones, schedules, GBP posting pathways, WhatsApp bridge |
| **Location growth** | Per-location hubs: heatmaps, menu insights, competitors, QR/booster, surveys |
| **Agency / partner** | White-label headers, joins, billing, public API surfaces |
| **Reliability** | Cron jobs, health checks, structured production errors, Sentry-compatible stack |

---

## Authenticated dashboard (session required)

Protected by middleware (`middleware.ts`); dev can bypass auth with `NODE_ENV=development` and without `ENABLE_AUTH_IN_DEV=true`.

| Path | Overview |
|------|----------|
| `/dashboard` | Command center — stats, trends, coach cards, recent reviews |
| `/reviews` | Review inbox / reply workflows |
| `/locations` | Location list, connect GBP, sync |
| `/locations/[id]/*` | Location hub segments (heatmap, inbox, competitors, menu insights, etc.) |
| `/v2` | v2 experimentation hub entry |
| `/analytics` | Cross-location analytics views |
| `/leaderboard` | Team / franchise leaderboard API-backed UI |
| `/reports` | Report generation / status |
| `/integrations` | Third-party integrations |
| `/templates` | Reply templates / grids |
| `/partner`, `/agency` | Partner program & agency console |
| `/developer` | API key / developer surface |
| `/subscribe` | Plans / Razorpay checkout |
| `/settings` | Billing, WhatsApp pairing, quotas |
| `/docs` | In-app documentation hub (overview + links to this file) |

---

## Public / limited-auth surfaces

| Path | Overview |
|------|----------|
| `/` | Marketing landing |
| `/login`, `/join/[token]` | Auth & agency join |
| `/score/[locationSlug]` | Public reputation score page |
| `/score/[slug]/embed` | Embeddable score (relaxed CSP for `frame-ancestors *`) |
| `/tools/free-reply` | Free-tier reply assistant (rate-limited; Redis when configured) |
| `/s/[slug]` | Short / campaign links as implemented |

---

## HTTP API overview

All handlers live under `app/api/`. Sensitive logic uses `connectDB()`, session checks (`getAppSession` / JWT), **`lib/production-error.ts`** for safe 500 payloads, **`lib/google-api-guards.ts`** / **`lib/rate-limit.ts`** where relevant.

### Health & cron

| Route | Role |
|------|------|
| `GET /api/health` | Readiness: Mongo handshake when URI or local-mongo setup present; **503** if production lacks `MONGODB_URI` or DB unreachable |
| `GET /api/health?live=1` | Liveness: cheap **200**, no DB (for brittle probes or sidecars) |
| `GET /api/cron/*` | Background jobs (`CRON_SECRET` bearer); sync reviews, reports, menus, competitor snapshots, campaigns, scheduled replies |

### AI & sentiment

- `POST /api/ai/generate-reply` — GPT/Groq routing (`lib/openai.ts`)
- `POST /api/sentiment/analyze` — multilingual sentiment helpers
- `POST /api/auto-reply/generate` — alternate generation path for automation

### Core data

- `GET|POST /api/locations`, `GET|PATCH /api/locations/[id]` — Locations CRUD + sync
- `GET /api/reviews`, `PATCH /api/reviews/[id]` — Reviews + replies
- `GET /api/insights/dashboard`, `POST /api/insights/owner-coach` — Aggregated dashboards

### Location intelligence (subset)

Benchmarks, predictions, emotion heatmaps, menu insights (+ export / refresh), map thumbnails, competitor analysis, investor/battle-card PDFs, highlight reel (Remotion), staff trackers, surveys, Zomato CSV bridge, booster QR, tone examples, bridge cards, GPB-related metadata routes.

### Webhooks & billing

- `/api/webhooks/twilio` — WhatsApp inbound (signature verify when configured)
- `/api/webhooks/razorpay` — subscription lifecycle
- `/api/subscriptions/*` — create / confirm / resume

### Developer / public API

- `GET|POST /api/user/public-api-key` — Scoped keys
- `GET /api/v1/locations/[locationId]/reviews` — Documented REST surface (`lib/public-api-auth.ts`)

### Miscellaneous

Alerts, leaderboard, referrals, badges, OG images, schema.org JSON, CSV export per location, dev-only seed routes, Razorpay plan mapping envs, billing summary.

---

## Security & headers

Configured in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, optional **HSTS** via `ENABLE_HSTS=true`.

---

## Mobile & layout

Responsive dashboard shell (`components/layout/DashboardAppShell.tsx`): drawer sidebar on `<lg`, collapsible sidebar on desktop, proper z-stacking vs scrim (`z-[45]` backdrop, `z-[55]` panel). Compact `TopBar` for small viewports.

---

## PDF spec parity (recent)

| Area | In-app | API / infra |
| --- | --- | --- |
| Apologetic tone & reply UX | Tone trainer + Reply modal (`apologetic`) | `POST /api/ai/generate-reply` |
| LLM authenticity advisory | Reply modal checker | `POST /api/ai/analyze-authenticity` (`Review.llmAuthenticity`) |
| Batch review digest | Dashboard **Review Summary** card | `POST /api/ai/summarize-reviews` |
| Topics in multilingual sentiment | Merged into insight phrases server-side | `lib/multilingual-sentiment.ts`, `generateInsightSummary` |
| Escalations inbox | **`/escalations`** nav | `GET /api/escalations`, `PATCH /api/escalations/[id]` · optional `ESCALATION_SLACK_WEBHOOK_URL` |
| Partner webhook (Zapier) | **`/integrations`** | `PATCH /api/user/webhook-settings` · `lib/partner-webhook.ts` |
| Yelp excerpts | **`/integrations`** (business ID) | `GET /api/locations/[id]/yelp-reviews`, `YELP_API_KEY` |
| Installable-ish UI | `app/manifest.ts` | Icons can be refined later |

Not fully replicated from the PDF: live Facebook Graph, Amazon, Shopify review sync (use webhooks/API where applicable).

---

## Related docs

- **`docs/ENVIRONMENT_VARIABLES.md`** — Env reference
- **`docs/PRODUCTION_CHECKLIST.md`** — Go-live checklist
- **`IMPLEMENTATION_GUIDE.md`** — MVP feature narratives & wiring examples
