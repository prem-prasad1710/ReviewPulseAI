# DriverSaathi (MVP)

WhatsApp-first **earnings truth**, **challan help**, **loan safety**, **document reminders**, **scam check**, **evidence vault**, **Challenger** complaint drafts, and a **driver confidence score** — Hindi-first mobile web + Meta WhatsApp Cloud API webhook.

## Quick start

```bash
cd driver
cp .env.example .env
npm install
npx prisma db push
npm run db:seed   # demo user 919999999999
npm run dev
```

- **Marketing / landing:** http://localhost:3000  
- **Driver app:** http://localhost:3000/d — login with `9999999999` (normalizes to `91…`).  
- **Admin:** http://localhost:3000/admin — set header `x-admin-token` to `ADMIN_TOKEN` from `.env`.

## WhatsApp (Meta Cloud API)

1. Create a WhatsApp Business app + **Permanent token** and **Phone number ID**.  
2. Set in `.env`: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`.  
3. Callback URL: `https://<your-host>/api/webhooks/whatsapp` — subscribe to `messages`.

If tokens are missing, inbound handling still runs but **outbound replies are logged only** (useful for local debugging).

## Features (MVP+)

- **Hisaab:** tolls/extra deductions, readable summary, history, WhatsApp share text + Challenger copy.
- **Wallet:** expense categories + weekly net hint.
- **Support drafts:** templates + ticket list (save / status / delete).
- **Compliance checklist** by vehicle type (Hindi).
- **Community board:** public recent scam-check signals (`/d/community`).
- **Profile:** name & city (`/d/more` → PATCH `/api/me`).
- **Localhost:** Pro/Free tier toggle for testing (`/api/me/subscription`).

## Stack

Next.js 14 (App Router), TypeScript, Tailwind, Prisma 5 + SQLite (swap `DATABASE_URL` for Postgres in production), Zod.

## Trust / legal

Copy shown in **Challenger** and **challan** flows is **draft education**, not legal advice. Earnings numbers are **estimates** from driver inputs and assumed commission bands in `src/lib/platform-fees.ts`.
