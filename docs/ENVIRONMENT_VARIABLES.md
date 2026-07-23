# Environment variables

Copy **`.env.example`** to `.env.local` for local development. Never commit secrets.

## Critical (production)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Atlas connection string (`lib/mongodb.ts`) |
| `MONGODB_DB_NAME` | Optional database name override |
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | JWT encryption for Auth.js session |
| `NEXTAUTH_URL` | Canonical OAuth callback base URL — **production:** `https://reviewspulse.in` (not `*.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Public site URL for SEO, sitemap, OG — **production:** `https://reviewspulse.in` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (`lib/auth.ts`, `lib/gbp.ts`) |
| `GOOGLE_REDIRECT_URI` | Optional override; defaults to `{NEXT_PUBLIC_APP_URL}/api/auth/callback/google` |
| `ENCRYPTION_KEY` | AES-256-GCM key for encrypting Google OAuth tokens stored per location (`lib/crypto.ts`). Generate: `openssl rand -hex 32`. **Must be identical across all deploys** — if you change it, users must reconnect Google at `/locations/connect`. |

Also set **`NEXT_PUBLIC_APP_URL`** and **`NEXTAUTH_URL`** to your custom domain (e.g. `https://reviewspulse.in`) so SEO and crons use the right host. **Do not** leave `NEXTAUTH_URL` pointing at `*.vercel.app` in Production — the app clears it automatically, but delete the stale value in Vercel to avoid confusion.

**OAuth troubleshooting (`CallbackRouteError`):** ensure Production env has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET` matching Google Cloud / your local `.env`. Redirect URI in Google must be exactly `https://reviewspulse.in/api/auth/callback/google`. Sign in from `https://reviewspulse.in/login` (www redirects to apex).

## Google OAuth redirect URIs (Cloud Console)

Register **all** environments you use:

- `http://localhost:3000/api/auth/callback/google` (local)
- `https://reviewspulse.in/api/auth/callback/google` (production)
- `https://www.reviewspulse.in/api/auth/callback/google` (www alias)
- Optional: `https://<your-vercel-project>.vercel.app/api/auth/callback/google` (preview only)

**Authorized JavaScript origins:** same hosts without the `/api/auth/...` path.

OAuth consent screen: app name **ReviewsPulse**, homepage `https://reviewspulse.in`, privacy `https://reviewspulse.in/privacy`.

## AI & LLMs

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI-compatible API (routing in `lib/openai.ts`) |
| `GROQ_API_KEY` | Groq provider |
| `OPENAI_BASE_URL` | Custom base URL override |
| `LLM_CHAT_MODEL` | Model id override |
| `OPENAI_WHISPER_API_KEY` | Whisper for voice transcripts (preferred over plain `OPENAI` when separating keys) |

**Do not expose** AI keys via `NEXT_PUBLIC_*` unless you intend client-side billing risk.

## Google server APIs (Places / Translate / Maps)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_PLACES_API_KEY` | Server-side Places |
| `GOOGLE_TRANSLATE_API_KEY` | Server-side Translate |
| `GOOGLE_MAPS_API_KEY` | Maps Static / related endpoints |

Restrictions: HTTP referrer locks break **server** calls — use IP/serverless-friendly restrictions.

## Messaging

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio REST |
| `TWILIO_AUTH_TOKEN` | Auth + webhook validation |
| `TWILIO_WHATSAPP_FROM` | WhatsApp sender (`whatsapp:+`) — **primary** for alerts, digest bot, and campaigns |
| `TWILIO_WEBHOOK_PUBLIC_URL` | Public base for webhook URLs (`lib/twilio-config.ts`) |
| `TWILIO_SKIP_SIGNATURE_VERIFY` | Dev-only emergency (`true`) |
| Various `*_CONTENT_SID` | Twilio template SIDs |

**Legacy (deprecated — do not use):** `TWILIO_WHATSAPP_NUMBER`, `TWILIO_PHONE_NUMBER` were used by `lib/alerts.ts` only. Production alerts use `TWILIO_WHATSAPP_FROM` via `lib/review-post-sync.ts`.

## Email

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Transactional mail |
| `FROM_EMAIL` | Default from header |

Alerts also reference **`NEXT_PUBLIC_BASE_URL`** fallback paths in SMS copy — align with canonical host.

## Rate limiting / cache

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Token |
| `ALLOW_PUBLIC_FREE_REPLY_WITHOUT_REDIS` | Escape hatch for `/api/public/free-reply` in prod when Redis absent |

## Storage & artifacts

| Variable | Purpose |
|----------|---------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for reports / renders |

## Razorpay

| Variable | Purpose |
|----------|---------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | API pair |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client checkout |
| `RAZORPAY_PLAN_STARTER`, `*_GROWTH`, `*_SCALE`, `*_AGENCY` | Plan id ↔ tier mapping |

## Cron & bridges

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Bearer for `/api/cron/*` |
| `CRON_SYNC_BATCH_SIZE`, `CRON_COMPETITOR_SNAPSHOT_BATCH_SIZE` | Tune batch concurrency |
| `ESCALATION_SLACK_WEBHOOK_URL` | Optional Slack incoming webhook for new low-star / keyword escalations |
| `YELP_API_KEY` | Yelp Fusion key for `/api/locations/[id]/yelp-reviews` previews |

## Local development

| Variable | Purpose |
|----------|---------|
| `USE_LOCAL_MONGO` | `true` → local/docker Mongo |
| `MONGODB_URI_LOCAL` | Full URI override |
| `USE_LOCAL_MONGO_NO_AUTH` | Anonymous local mongo |
| `LOCAL_MONGO_HOST_PORT` | Port (default **27018**) |
| `ENABLE_AUTH_IN_DEV` | Require real session during dev (`middleware.ts`) |
| `AUTH_DISABLED_FOR_DEV` | UI dev badge pathway (`lib/auth-dev.ts`) |
| `DEV_MOCK_DASHBOARD` | Dashboard sample data toggle |
| `ALLOW_DEV_SEED`, `ALLOW_INSECURE_TLS_FOR_DEV`, etc. | See `app/api/dev/seed-test-data` |

## Hardening

| Variable | Purpose |
|----------|---------|
| `ENABLE_HSTS` | `true` → `Strict-Transport-Security` |
| `SENTRY_*` | `@sentry/nextjs` |

## Observatory

| Variable | Purpose |
|----------|---------|
| `AGENCY_HOST_MAP` | `host:agencyId` CSV for white-label ingress (`middleware.ts`) |
| `VERCEL` | Affects tracing root (`next.config.ts`) |
