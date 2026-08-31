# ReviewPulse

**ReviewsPulse** is an AI-assisted Google Business Profile review platform for Indian SMBs — unified inbox, multilingual AI replies, analytics, WhatsApp alerts, Razorpay billing, and agency white-label tooling.

**Video Preview** : 
<video src = "public/brand/reviewpulse-product-video.mp4"></video>
**Live:** [review-pulse-ai-sigma.vercel.app](https://reviewspulse.in)

---

## Highlights

| Capability | Description |
|------------|-------------|
| **Review inbox** | All locations and reviews in one dashboard with sentiment and urgency filters |
| **AI replies** | Hindi, English, and Hinglish drafts with tone controls — you approve before publish |
| **Google sync** | OAuth-connected GBP locations with encrypted token storage |
| **WhatsApp bridge** | Alerts for low-star reviews and digest notifications via Twilio |
| **Billing** | Razorpay Standard Checkout — UPI, cards, net banking; INR plans from ₹499/mo |
| **Agency mode** | White-label headers, multi-client locations, partner join links |
| **Public tools** | Free AI reply generator, embeddable reputation score, review widgets |
| **Automation** | Cron-driven sync, scheduled replies, monthly PDF reports |

---

## Landing experience

The marketing site (`/`) includes:

- **Product demo video** — hosted at `/brand/reviewpulse-product-video.mp4` in the “See ReviewsPulse in 90 seconds” section (`#demo`)
- **Scroll animations** — `Reveal` motion components on every section
- **Interactive 3D hero** — `LandingHero3D` tilt preview (respects `prefers-reduced-motion`)
- **Electric flow diagram** — animated product story (`LandingElectricFlow`)
- **Feature explorer** — 3D swipeable cards on desktop, horizontal scroll on mobile
- **Pricing showcase**, FAQ, testimonials, and JSON-LD for SEO

Optional override: set `NEXT_PUBLIC_DEMO_VIDEO_URL` to a YouTube/Loom embed URL.

---

## Razorpay billing (Standard Checkout)

Order-first subscription flow:

1. **First month** — paid immediately via Razorpay Orders API
2. **Recurring** — Razorpay Subscription scheduled from month two
3. **Confirm** — server verifies HMAC signature before activating the plan

| Endpoint | Purpose |
|----------|---------|
| `POST /api/subscriptions/create` | Create order for plan checkout (authenticated) |
| `POST /api/subscriptions/confirm` | Verify payment + activate subscription |
| `POST /api/create-order` | Generic order creation (amount in paise) |
| `POST /api/verify-payment` | Generic signature verification |
| `POST /api/webhooks/razorpay` | Webhook backup for subscription lifecycle |

Required environment variables:

```env
RAZORPAY_KEY_ID=rzp_live_…
RAZORPAY_KEY_SECRET=…
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_…   # same Key ID as above
RAZORPAY_WEBHOOK_SECRET=…
RAZORPAY_PLAN_STARTER=plan_…
RAZORPAY_PLAN_GROWTH=plan_…
RAZORPAY_PLAN_SCALE=plan_…
RAZORPAY_PLAN_AGENCY=plan_…
```

`RAZORPAY_KEY_SECRET` is server-only — never expose it to the browser.

Checkout UX uses a single toast slot (`lib/checkout-toast.ts`) so loading states cannot get stuck after payment.

---

## Quick start (development)

```bash
cp .env.example .env.local
# Fill MONGODB_URI, NEXTAUTH_SECRET, Google OAuth, NEXT_PUBLIC_APP_URL

npm install
npm run dev
```

Local Mongo via Podman (optional):

```bash
npm run mongo:local:up
# USE_LOCAL_MONGO=true in .env.local
```

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production bundle |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run seed:test` | Demo data (local only; requires `ALLOW_DEV_SEED=true`) |

---

## Architecture

- **Framework:** Next.js 16 App Router (`app/`), React Server Components
- **Database:** MongoDB via Mongoose (`lib/mongodb.ts`, `models/*`)
- **Auth:** Auth.js v5 + Google OAuth (`next-auth`)
- **AI:** OpenAI-compatible routing including Groq (`lib/openai.ts`)
- **Payments:** Razorpay Node SDK + Checkout.js overlay
- **Email:** Resend · **WhatsApp:** Twilio · **Storage:** Vercel Blob
- **Observability:** Sentry, Vercel Analytics & Speed Insights
- **Security:** CSP + optional HSTS (`ENABLE_HSTS=true`), encrypted Google tokens

Boot-time `instrumentation.ts` validates critical env vars and warns on missing optional integrations.

---

## Plans (INR / month)

| Plan | Price | Locations | AI replies |
|------|-------|-----------|------------|
| Free | ₹0 | 1 | 10/mo |
| Starter | ₹499 | 1 | 100/mo |
| Growth | ₹999 | 3 | 500/mo |
| Scale | ₹1,999 | 10 | Unlimited |
| Agency | ₹2,999 | 20 clients | Unlimited |

New accounts receive a **14-day Growth trial** (no card required).

---

## Health probes

| URL | Behaviour |
|-----|-----------|
| `GET /api/health` | Readiness incl. Mongo (503 if prod missing Atlas URI or unreachable) |
| `GET /api/health?live=1` | Liveness-only 200 |

---

## Production security

- Dashboard routes require session (middleware + `proxy.ts`)
- Dev auth bypass and seed routes are **disabled in production**
- Razorpay webhooks verified with HMAC; payments not marked paid on signature mismatch
- Google OAuth tokens encrypted at rest (`ENCRYPTION_KEY`)
- Rate limiting via Upstash Redis on sensitive endpoints
- Cron routes protected with `CRON_SECRET` bearer token

See **`docs/PRODUCTION_CHECKLIST.md`** before go-live.

---

## Documentation

| File | Contents |
|------|----------|
| `docs/FEATURE_CATALOG.md` | UI routes, API inventory, cron, embeds |
| `docs/ENVIRONMENT_VARIABLES.md` | All configuration keys |
| `docs/PRODUCTION_CHECKLIST.md` | Go-live validation |
| `IMPLEMENTATION_GUIDE.md` | MVP narratives + integration examples |
| In-app **`/docs`** | Authenticated operator hub |

---

## Recent changes

- Product demo video on landing page (`public/brand/reviewpulse-product-video.mp4`)
- Razorpay Standard Checkout (`/api/create-order`, `/api/verify-payment`) with shared signature verification
- Fixed billing resume banner falsely showing after successful first-month payment
- Fixed stuck checkout loading toast (single toast ID lifecycle)
- Production copy on landing, subscribe, and billing surfaces

---

## License

Closed-source product repository — internal distribution unless stated otherwise.
