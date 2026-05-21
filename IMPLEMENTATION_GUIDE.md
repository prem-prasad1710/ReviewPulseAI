# ReviewPulse MVP Feature Implementation Guide

## Overview

This document covers the implementation of ReviewPulse's **MVP (Minimum Viable Product)** features for the India-first AI review assistant platform. These features directly address core user pain-points and market gaps.

## ✅ Implemented Features

### 1. **Real-Time Alerts & Assignment** (HIGH IMPACT)

**Purpose**: Enable SMBs to respond quickly to critical issues with instant notifications.

#### Components:
- **`lib/alerts.ts`** - Alert Manager Service
  - Sends multi-channel alerts (Email, SMS, WhatsApp)
  - Escalation rules for unreplied low-rating reviews
  - Localized alert content (English, Hindi, Hinglish)

#### API Endpoints:
```
POST /api/alerts/send - Send alert for a review
GET /api/alerts/config - Get user's alert configuration
```

#### Features:
✅ Email alerts for 1-2★ reviews  
✅ SMS/WhatsApp notifications  
✅ Escalation after 24 hours if unreplied  
✅ Multi-language alert content  
✅ Alert history logging  

#### Integration:
```typescript
import { alertManager } from '@/lib/alerts'

// Send alert
await alertManager.sendLowRatingAlert(alertPayload, config)
```

---

### 2. **Multilingual Sentiment & Auto-Reply** (HIGH IMPACT)

**Purpose**: Analyze reviews in Hindi/English/Hinglish and generate contextual AI replies.

#### Components:
- **`lib/multilingual-sentiment.ts`** - Sentiment Analyzer
  - Emotion detection (joy, frustration, gratitude, disappointment, anger, surprise)
  - Multilingual language detection
  - Urgency classification for alerting
  - Key phrase extraction

- **`lib/auto-reply-engine.ts`** - AI Reply Engine
  - Multilingual reply generation (English, Hindi, Hinglish)
  - Tone customization (professional, friendly, grateful, formal, concise)
  - A/B variant generation for testing
  - Compliance checking (healthcare, legal, finance)

#### API Endpoints:
```
POST /api/sentiment/analyze - Analyze single review
PUT /api/sentiment/batch - Analyze multiple reviews
POST /api/auto-reply/generate - Generate reply
PUT /api/auto-reply/variants - Generate variants for A/B testing
```

#### Features:
✅ Sentiment scoring (0-1 scale)  
✅ Emotion classification  
✅ Language detection (Hindi/English/Hinglish)  
✅ Urgency levels (low/medium/high)  
✅ Hindi/English/Hinglish reply generation  
✅ Tone-aware responses  
✅ A/B testing variants  
✅ Compliance mode for regulated industries  
✅ Key phrase extraction  

#### Integration:
```typescript
import { sentimentAnalyzer } from '@/lib/multilingual-sentiment'
import { autoReplyEngine } from '@/lib/auto-reply-engine'

// Analyze sentiment
const result = await sentimentAnalyzer.analyzeReview(text, language)

// Generate reply
const reply = await autoReplyEngine.generateReply({
  businessName: 'My Restaurant',
  reviewText: 'Food was great but service was slow',
  language: 'hinglish',
  tone: 'grateful'
})
```

---

### 3. **AI Insights Dashboard** (HIGH IMPACT)

**Purpose**: Provide at-a-glance business intelligence from review data.

#### Components:
- **`lib/insights-aggregator.ts`** - Insights Generator
  - Comprehensive dashboard data aggregation
  - Trend analysis (sentiment improving/declining)
  - Top issues and praise extraction
  - Performance metrics
  - Actionable recommendations
  - Language distribution analysis

#### API Endpoints:
```
GET /api/insights/dashboard?locationId=X&days=30 - Get dashboard insights
POST /api/insights/export - Export as PDF/CSV/JSON
```

#### Dashboard Metrics:
✅ Total reviews & average rating  
✅ Response rate percentage  
✅ Sentiment breakdown (positive/neutral/negative)  
✅ Sentiment trend detection  
✅ Rating distribution by star  
✅ Rating trend over time  
✅ Recovered reviews count  
✅ Top issues with frequency  
✅ Top praise points  
✅ Performance analysis (best/worst days)  
✅ Alert summary  
✅ Actionable recommendations  
✅ Language distribution  

#### UI Component:
```typescript
import { InsightsDashboard } from '@/components/dashboard/insights-dashboard'

<InsightsDashboard locationId={locationId} />
```

---

### 4. **Multilingual UI** (MEDIUM IMPACT)

**Purpose**: Support English, Hindi, and Hinglish interface for Indian SMBs.

#### Components:
- **`lib/i18n-client.ts`** - Translation Provider
  - Hook-based translation system
  - Support for English, Hindi, Hinglish
  - Database of 50+ translated strings
  - Context-based language switching

#### Usage:
```typescript
import { useTranslation } from '@/lib/i18n-client'

const { t, language, setLanguage } = useTranslation()

<select onChange={(e) => setLanguage(e.target.value)}>
  <option value="en">English</option>
  <option value="hi">हिंदी</option>
  <option value="hinglish">Hinglish</option>
</select>

<h1>{t('insights.total_reviews')}</h1>
```

---

### 5. **Auto-Reply UI Generator** (`components/dashboard/auto-reply-generator.tsx`)

**Purpose**: User-friendly interface to generate and select AI replies.

#### Features:
✅ Real-time reply preview  
✅ Language selection (English/Hindi/Hinglish)  
✅ Tone customization  
✅ Multiple variant generation  
✅ Copy to clipboard functionality  
✅ Review context display  

#### UI Integration:
```typescript
import { AutoReplyGenerator } from '@/components/dashboard/auto-reply-generator'

<AutoReplyGenerator
  reviewText="Food was delicious but service was slow"
  reviewRating={3}
  businessName="My Restaurant"
  tone="grateful"
  onReplyGenerated={(reply) => console.log(reply)}
/>
```

---

### 6. **Sentiment Analysis Display** (`components/dashboard/sentiment-analysis-display.tsx`)

**Purpose**: Visual sentiment analysis results with emotion and urgency indicators.

#### Features:
✅ Sentiment scoring visualization  
✅ Emotion classification display  
✅ Language detection badge  
✅ Urgency level indicator  
✅ Key phrases highlighting  
✅ One-line summary  
✅ Batch analysis capability  

#### UI Integration:
```typescript
import { SentimentAnalysisDisplay } from '@/components/dashboard/sentiment-analysis-display'

<SentimentAnalysisDisplay
  reviewText="Amazing experience! Will come again"
  autoAnalyze={true}
/>
```

---

### 7. **Background Job Scheduler** (`lib/background-jobs.ts`)

**Purpose**: Automated recurring tasks for alerts, analysis, and reports.

#### Scheduled Jobs:
1. **Low-Rating Alert Scanner** (Every 5 minutes)
   - Detects new 1-2★ reviews
   - Sends alerts based on user preferences
   - Tracks alert status

2. **Sentiment Analysis** (Every 15 minutes)
   - Batch analyzes unanalyzed reviews
   - Updates sentiment scores and emotions
   - Detects language

3. **Alert Escalation** (Every hour)
   - Checks unreplied 24+ hour old alerts
   - Sends escalation notifications
   - Logs escalations

4. **Weekly Reports** (Every Monday, 8 AM)
   - Generates comprehensive weekly summaries
   - Email delivery to users
   - Historical tracking

#### Initialization:
```typescript
import { backgroundJobScheduler } from '@/lib/background-jobs'

// Initialize on app startup (e.g., in middleware or layout)
await backgroundJobScheduler.initialize()

// Check status
const status = backgroundJobScheduler.getStatus()
```

---

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
npm install cron
```

### 2. Environment Variables Required
```env
# Alerts & Notifications
RESEND_API_KEY=your_resend_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# OpenAI (for sentiment & replies)
OPENAI_API_KEY=your_openai_api_key

# Database
MONGODB_URI=your_mongodb_uri

# App
NEXT_PUBLIC_BASE_URL=https://yourapp.com

# Google — server-side only (do NOT prefix with NEXT_PUBLIC_*)
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_TRANSLATE_API_KEY=

# Rate limiting across instances (recommended in production)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

> Full reference: see **Google Cloud APIs (Places, Maps Static & Translation)** below.

### 3. Initialize Background Jobs

Create/update `app/layout.tsx`:
```typescript
import { backgroundJobScheduler } from '@/lib/background-jobs'

export default function RootLayout({ children }) {
  // Initialize jobs once on app startup
  if (typeof window === 'undefined') {
    backgroundJobScheduler.initialize().catch(console.error)
  }

  return <html>{children}</html>
}
```

### 4. Add Dashboard Pages

Create `app/(dashboard)/insights/page.tsx`:
```typescript
'use client'

import { InsightsDashboard } from '@/components/dashboard/insights-dashboard'
import { useSession } from 'next-auth/react'

export default function InsightsPage() {
  const { data: session } = useSession()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">📊 AI Insights Dashboard</h1>
      <InsightsDashboard />
    </div>
  )
}
```

---

## Google Cloud APIs (Places, Maps Static & Translation)

ReviewPulse talks to Google **only from the Node server**. Keys stay in `.env*` / hosting secrets — never expose them via `NEXT_PUBLIC_*` or embed them in browser JavaScript.

### Environment variables

| Variable | Purpose in this codebase |
|---------|---------------------------|
| `GOOGLE_PLACES_API_KEY` | **Preferred** for Place Details (`lib/places-details.ts`): competitor snapshots, cron refreshes. Uses **Places API (New)** with `X-Goog-Api-Key`; falls back to legacy JSON if needed. |
| `GOOGLE_MAPS_API_KEY` | **Maps Static API** proxy: `GET /api/locations/[id]/map-thumb` (`lib/google-api-keys.ts`). Also **fallback** Places key when `GOOGLE_PLACES_API_KEY` is unset. |
| `GOOGLE_TRANSLATE_API_KEY` | **Cloud Translation v2**: non‑English review text → English during sync (`lib/translate-review.ts`, `processReviewAfterSync`). |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **Optional but recommended**: distributed rate limits (`lib/rate-limit.ts`). Without Redis, in-memory guards apply **per server process**. |

Duplicate `.env` keys shown in-repo: `.env.example`.

### GCP setup checklist

1. [Google Cloud Console](https://console.cloud.google.com/) — project selected, **billing enabled**.
2. **APIs & Services → Library** — enable:
   - **Places API** (legacy Place Details fallback).
   - **Places API (New)** (primary `places.googleapis.com` Details call).
   - **Maps Static API** (thumbnail proxy).
   - **Cloud Translation API**.
3. **APIs & Services → Credentials** — restrict keys **by enabled API**; for pure server‑side routes prefer **application restriction: None** plus **API restriction** lists (not HTTP referrers). Optionally use separate keys per vendor surface.

#### ⚠️ Why “Website restrictions” (HTTP referrers) break Competitor Spy / cron

Places, Static Maps proxy, and Translation in this repo are called from **`fetch()` inside Next.js API routes** (your **Node server on Vercel or localhost), not from a browser tab.

- Browser calls send an **HTTP Referer** (e.g. `https://review-pulse-ai-sigma.vercel.app`). **Server-side `fetch()` does not** send that referer correctly for these APIs → Google treats it as **`referer <empty>`** and responds **`403 PERMISSION_DENIED`** (“Requests from referer &lt;empty&gt; are blocked”).
- **Legacy Places Web Service**: keys with referer (“website”) restrictions are **rejected outright** (`REQUEST_DENIED` — *API keys with referer restrictions cannot be used with this API*).

Adding `http://localhost:3000/` and your Vercel URL to **Website restrictions** therefore **cannot** fix server-to-Google calls.

**Correct pattern for ReviewPulse:**

1. For keys in **`GOOGLE_PLACES_API_KEY`**, **`GOOGLE_MAPS_API_KEY`**, **`GOOGLE_TRANSLATE_API_KEY`**:  
   **Application restrictions → None** (“Don’t restrict key”) **or**, if Google offers it for your workload, **IP addresses** pointing at stable server egress IPs.  
   **Do not use “HTTP referrers (websites)”** for these backend keys.

2. **API restrictions**: set **Restrict key → “Restrict key”** and allow only what you need, for example **Places API**, **Places API (New)** (may appear as Places API naming in console), **Maps Static API**, **Cloud Translation API**. That reduces blast radius without referrers.

3. *(Optional)* If you later add **Maps JavaScript** in the **browser**, create a **second** API key restricted to **HTTP referrers** for that frontend use — keep it separate from `.env` server keys.

### SKU / billing notes (approximate)

Google renames tiers occasionally; validate in **[Maps billing & pricing](https://developers.google.com/maps/billing-and-pricing)** and **Cloud Translation pricing** after your first requests.

| In-app usage | Surface | Typical meter |
|--------------|---------|----------------|
| Competitor add + nightly `/api/cron/sync-competitors` | Place Details (New) first, legacy Details fallback | Place Details‑related SKUs; review fields typically map to richer “Enterprise / atmosphere” style SKUs |
| Location hub map image | Maps Static API | Static map requests per load |
| Multilingual reviews after GBP sync | `translation.googleapis.com` … `/v2` | Characters translated |

Costs appear under **Billing → Reports** filtered by SKU and API.

### Rate limits enforced in-app

Defined in **`lib/rate-limit.ts`** (Upstash) and **`lib/google-api-guards.ts`** + **`lib/memory-sliding-window.ts`** (fallback). Examples when Redis is configured: global Places outbound (per minute), per‑user competitor Places lookups (per hour), Translate global + per user, Static Maps per user. See source for exact sliders.

---

### How to test that Places, Maps, and Translation APIs work

**Prerequisite:** `npm run dev` (or staging URL), MongoDB reachable, keys in `.env.local`, rebuilt/restarted after edits.

#### 1) Places API — product flow

Requires **Growth or Scale** (`planAllowsCompetitorSpy`). Steps:

1. Sign in → **Dashboard** → choose a location → **Competitors** (`/locations/<locationMongoId>/competitors`).
2. Paste a real **Maps place URL** → **Save competitor**.
   - **Success:** new row with name, address, star snapshot → Places path is alive.
   - **503:** key missing / API disabled / invalid place resolution — check terminal logs (`places-details` / HTTP status snippets; no keys are logged).
   - **429:** app rate limits (wait or adjust Upstash thresholds).

Cron path (optional): invoke your deployed **`POST /api/cron/sync-competitors`** using the secret your project expects (`CRON_SECRET` or equivalent in `route.ts`). Confirm responses and that competitor `placesSnapshotFetchedAt` refreshes.

#### 2) Maps Static API — product flow

1. Set **`GOOGLE_MAPS_API_KEY`** and enable **Maps Static API** in GCP.
2. Open the **location hub** (`/locations/<locationMongoId>`).
3. You should see the **map preview** card (skipped for mock/demo locations).

Sanity checks:

- Browser **Network**: request **`/api/locations/<id>/map-thumb`** should return **200** and `Content-Type: image/png` (or related image).
  - **401** — not logged in.
  - **429** — Static Maps rate limit hit.
  - **503** — Maps key missing.
  - **502** — Google rejected the Static Maps request (billing, key restrictions, quota) — check server stderr.

#### 3) Translation API — product + quick curl

**In-product:** ensure **`GOOGLE_TRANSLATE_API_KEY`** is set and **Cloud Translation API** enabled. After a GBP **sync**, new reviews in a non‑English language (with comment **longer than 10 characters**) should get `translatedText` populated where applicable (see **`processReviewAfterSync`**). Short comments and `detectedLanguage === 'en'` skip Translation by design.

**Direct API check (avoid logging keys):**

```bash
export GOOGLE_TRANSLATE_API_KEY="YOUR_KEY_HERE"   # Prefer loading from `.env.local` manually in dev

# Key only from env — do not expose in screenshots or commits.
curl -sS -X POST \
  "https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"q":"नमस्ते दुनिया","source":"hi","target":"en","format":"text"}'
```

Expect JSON with **`translatedText`** (and no `403`/`400` quota errors).

**GCP dashboards:** **APIs & Services → Metrics** (or Billing → Cost table) spikes when you exercise each flow above.

---

## 🚀 Usage Examples

### Alert Management
```typescript
// Send alert for low rating
await alertManager.sendLowRatingAlert(
  {
    locationId: 'loc_123',
    userId: 'user_123',
    reviewId: 'rev_123',
    reviewerName: 'John',
    rating: 2,
    comment: 'Service was poor',
    sentiment: 'negative',
    language: 'english'
  },
  {
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    minRatingThreshold: 2,
    channels: ['email'],
    escalateAfterMinutes: 1440
  }
)
```

### Sentiment Analysis
```typescript
// Single review analysis
const result = await sentimentAnalyzer.analyzeReview(
  'भोजन बहुत स्वादिष्ट था लेकिन सेवा धीमी थी',
  'hindi'
)
// Returns: { sentiment: 'neutral', emotion: 'disappointment', ... }

// Batch analysis
const results = await sentimentAnalyzer.analyzeBatch([
  { id: '1', text: 'Great food!' },
  { id: '2', text: 'Terrible experience' }
])
```

### Reply Generation
```typescript
// Generate reply
const reply = await autoReplyEngine.generateReply({
  businessName: 'Taj Mahal Restaurant',
  businessCategory: 'Restaurant',
  reviewText: 'Food was amazing!',
  reviewRating: 5,
  reviewerName: 'Amit',
  language: 'hinglish',
  tone: 'grateful',
  sentiment: 'positive'
})
// Returns: { reply: "Shukriya Amit! Humari khushi...", tone: 'grateful' }

// Generate variants for A/B testing
const variants = await autoReplyEngine.generateReplyVariants(
  { /* same config */ },
  3 // number of variants
)
```

### Dashboard Insights
```typescript
// Get insights
const insights = await insightsAggregator.generateDashboardInsights(
  'user_123',
  'location_456',
  30 // days
)

// Access data
console.log(insights.overview.totalReviews)
console.log(insights.sentiment.positive)
console.log(insights.recommendations)
```

---

## 📊 Data Flow Diagram

```
Review Submitted
    ↓
[Sentiment Analysis] ← AI Sentiment Engine
    ↓
[Emotion Detection + Language]
    ↓
[Low Rating? (≤2 stars)] → YES → [Alert Manager] → Email/SMS/WhatsApp
    ↓ NO
[Insights Aggregator Updates]
    ↓
[Dashboard Fetches Data]
    ↓
[AI Reply Engine Ready for User]
    ↓
[User Reviews & Publishes Reply]
    ↓
[Background Jobs Track Metrics]
    ↓
[Weekly Report Generated]
```

---

## 🎯 Key Performance Indicators (KPIs)

Track these metrics to measure MVP success:

1. **Engagement**
   - Dashboard DAU/WAU
   - Auto-reply adoption rate
   - Alert response rate

2. **Quality**
   - AI reply accuracy (manual audit)
   - Sentiment analysis precision
   - False alert rate

3. **Business Impact**
   - Average rating improvement
   - Response time reduction
   - Review volume increase

4. **Technical**
   - API latency (<2s)
   - Job success rate (>99%)
   - Uptime (>99.5%)

---

## 🔐 Security & Compliance

- ✅ All API routes require authentication
- ✅ Healthcare/Legal/Finance compliance modes
- ✅ Alert content filtering
- ✅ Rate limiting on API endpoints
- ✅ Data encryption in transit
- ✅ GDPR-compliant data handling

---

## 📝 Next Steps

1. **Test thoroughly** in staging before production
2. **Monitor job execution** with logging
3. **Collect user feedback** on reply quality
4. **Iterate on prompts** based on results
5. **Add multi-location support** if needed
6. **Implement review request automation** for volume growth

---

## 🐛 Troubleshooting

### Alerts not sending?
- Check `OPENAI_API_KEY` and `RESEND_API_KEY` in `.env`
- Verify email/phone numbers are valid
- Check alert configuration in user settings

### Sentiment analysis inaccurate?
- Ensure reviews have sufficient text (>20 characters)
- Check language detection in results
- Verify OpenAI API credits
- Review fallback analysis for short texts

### Background jobs not running?
- Check `require('cron')` is installed
- Verify initialization in layout
- Check server logs for job execution
- Ensure database connection is active

### Google Places, Maps Static, or Translation?
- See **Google Cloud APIs (Places, Maps Static & Translation)** earlier in this document (setup, SKU notes, step-by-step tests).
- Typical causes: wrong **API restriction** on the key, **`REQUEST_DENIED`** (billing/quota), Maps Static restricted by **credential type**, or Translate key not enabled for **Cloud Translation API**.
- **`Requests from referer <empty>`** or **referer restrictions cannot be used with this API**: you applied **Website (HTTP referrer) restrictions** to a **server-side** key. Remove referrer restrictions from that key (see the warning subsection under **GCP setup checklist**) and rely on **API restrictions** instead.

---

## 📚 Additional Resources

- OpenAI API Docs: https://platform.openai.com/docs
- Twilio Docs: https://www.twilio.com/docs
- Resend Docs: https://resend.com/docs
- Cron Syntax: https://crontab.guru

---

**Last Updated**: May 2026  
**Version**: 1.0.0 (MVP)  
**Status**: ✅ Production Ready
