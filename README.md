# ReviewPulse

AI-assisted **Google Business Profile–centric review operations** — inbox, multilingual sentiment, dashboards, WhatsApp bridging, Razorpay plans, agency white-label tooling, cron-driven sync/report jobs.

## Quick start

```bash
cp .env.example .env.local
# Fill MONGODB_URI, NEXTAUTH_SECRET, Google OAuth trio, NEXT_PUBLIC_APP_URL

npm install
npm run dev
```

Local Mongo via Podman (optional):

```bash
npm run mongo:local:up
# USE_LOCAL_MONGO=true in .env.local
```

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production bundle |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run seed:test` | Scripted demo data |

## Documentation (authoritative references)

| File | Contents |
|------|----------|
| `docs/FEATURE_CATALOG.md` | UI routes, API inventory, cron, embeds, security posture |
| `docs/ENVIRONMENT_VARIABLES.md` | All configuration keys grouped by subsystem |
| `docs/PRODUCTION_CHECKLIST.md` | Go-live validation |
| `IMPLEMENTATION_GUIDE.md` | MVP narratives + integration examples |
| In-app **`/docs`** | Authenticated hub linking operators to the files above |

## Health probes

| URL | Behaviour |
|-----|-----------|
| `GET /api/health` | Readiness incl. Mongo (503 if prod missing Atlas URI or unreachable) |
| `GET /api/health?live=1` | Liveness-only 200 |

## Architecture snapshot

- **Framework:** Next.js App Router (`app/`), React Server Components where practical
- **Data:** Mongoose (`lib/mongodb.ts`, `models/*`)
- **Auth:** Auth.js beta (`next-auth` v5) + Google OAuth
- **Realtime AI:** Routed OpenAI-compatible client incl. Groq (`lib/openai.ts`)
- **Security headers:** `next.config.ts`; optional **HSTS** via `ENABLE_HSTS=true`

## Production instrumentation

Boot-time **`instrumentation.ts`** logs blocking misconfiguration (critical env) and emits warnings for dormant optional integrations (AI, WhatsApp, Razorpay, Redis ratelimiter, cron, blob storage).

## License / support

Closed-source product repository — internal distribution unless stated otherwise.
