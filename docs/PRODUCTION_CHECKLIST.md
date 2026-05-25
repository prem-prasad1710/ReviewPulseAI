# Production readiness checklist

Use this before declaring a release **production-grade**. Adjust for your infra (Vercel, Docker, Kubernetes).

## 1. Secrets & configuration

- [ ] `MONGODB_URI`, `NEXTAUTH_SECRET` (or `AUTH_SECRET`), `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
- [ ] Google OAuth triple (`GOOGLE_CLIENT_ID`, …) validated on staging OAuth consent
- [ ] AI keys routed **server-only** (`OPENAI_API_KEY` / `GROQ_*`); never `NEXT_PUBLIC_*` AI keys
- [ ] Razorpay live keys + webhook URL registered | Twilio webhook base `TWILIO_WEBHOOK_PUBLIC_URL`
- [ ] `CRON_SECRET` rotated; schedulers configured (Vercel Cron / external cron hitting `/api/cron/*` with Bearer)
- [ ] Redis Upstash URLs for any rate-limited public routes you expose

Boot-time logs from **`instrumentation.ts`** summarize missing optional integrations—fix anything you depend on before launch traffic.

## 2. Observability & health

- [ ] Probe **`GET /api/health`** (readiness incl. Mongo); use **`GET /api/health?live=1`** for cheap liveness
- [ ] Wire Sentry DSN (`@sentry/nextjs`)
- [ ] dashboards for 5xx + latency (`/api/*`, especially AI + GBP sync routes)

## 3. Security

- [ ] `ENABLE_HSTS=true` once HTTPS terminates correctly everywhere
- [ ] Review CSP for embed routes (`next.config.ts` already special-cases `/score/*/embed`)
- [ ] Cron & dev-only routes inaccessible publicly (`CRON_SECRET`, `NODE_ENV` guards)

## 4. Data & quotas

- [ ] Atlas IP allowlists / VPC for serverless egress
- [ ] Google Places/Maps API quotas monitored
- [ ] Twilio/message rate limits validated for alert fan-out (`lib/alerts.ts`)

## 5. Operational runbooks

- [ ] Rotate `NEXTAUTH_SECRET` procedure documented (invalidates sessions)
- [ ] Rollback playbook (previous deployment + revert DB migrations if manual)
- [ ] Document support contact + **docs/FEATURE_CATALOG.md** ownership

## 6. Post-deploy smoke

- [ ] Sign-in flow (Google) end-to-end
- [ ] Open `/reviews` & sync one GBP location (`/locations`)
- [ ] Generate one AI reply — verify provider billing & logs
- [ ] Hit `/docs` authenticated — documentation loads
- [ ] Mobile sidebar open/close (stacking sanity)
