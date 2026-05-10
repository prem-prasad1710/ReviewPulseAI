# 🚀 ReviewPulse MVP - Quick Reference

## 📁 File Structure - New Files

```
reviewpulse/
├── lib/
│   ├── alerts.ts                           (8.2 KB) - Real-time alert manager
│   ├── multilingual-sentiment.ts           (6.7 KB) - Sentiment & emotion analysis
│   ├── auto-reply-engine.ts               (10 KB) - AI reply generation
│   ├── insights-aggregator.ts             (14 KB) - Dashboard data aggregator
│   ├── background-jobs.ts                 (7.6 KB) - Cron job scheduler
│   └── i18n-client.ts                     (6.7 KB) - Bilingual UI support
│
├── app/api/
│   ├── alerts/send/route.ts               (2.6 KB)
│   ├── sentiment/analyze/route.ts         (1.8 KB)
│   ├── auto-reply/generate/route.ts       (2.8 KB)
│   └── insights/dashboard/route.ts        (2.0 KB)
│
├── components/dashboard/
│   ├── auto-reply-generator.tsx           (7.7 KB)
│   ├── sentiment-analysis-display.tsx     (6.7 KB)
│   └── insights-dashboard.tsx             (10 KB)
│
├── IMPLEMENTATION_GUIDE.md                (Complete setup guide)
└── MVP_IMPLEMENTATION_SUMMARY.md          (This summary)
```

## 🔗 Import Examples

### Import Core Services
```typescript
// Alerts
import { alertManager } from '@/lib/alerts'

// Sentiment Analysis
import { sentimentAnalyzer } from '@/lib/multilingual-sentiment'

// Auto-Reply Engine
import { autoReplyEngine } from '@/lib/auto-reply-engine'

// Dashboard Insights
import { insightsAggregator } from '@/lib/insights-aggregator'

// Background Jobs
import { backgroundJobScheduler } from '@/lib/background-jobs'

// Translations
import { useTranslation } from '@/lib/i18n-client'
```

### Use UI Components
```typescript
import { InsightsDashboard } from '@/components/dashboard/insights-dashboard'
import { AutoReplyGenerator } from '@/components/dashboard/auto-reply-generator'
import { SentimentAnalysisDisplay } from '@/components/dashboard/sentiment-analysis-display'
```

## ⚡ Quick Code Snippets

### 1. Send Alert
```typescript
await alertManager.sendLowRatingAlert({
  locationId: 'loc_123',
  userId: 'user_123',
  reviewId: 'rev_123',
  reviewerName: 'John',
  rating: 1,
  comment: 'Terrible service',
  sentiment: 'negative',
  language: 'english'
}, {
  enableEmailAlerts: true,
  enableSMSAlerts: true,
  minRatingThreshold: 2,
  channels: ['email', 'sms', 'whatsapp']
})
```

### 2. Analyze Sentiment
```typescript
const result = await sentimentAnalyzer.analyzeReview(
  'Food was great but service was slow',
  'english'
)
console.log(result.sentiment)      // 'neutral'
console.log(result.emotion)        // 'disappointment'
console.log(result.urgency)        // 'medium'
console.log(result.keyPhrases)     // ['great food', 'slow service']
```

### 3. Generate Reply
```typescript
const reply = await autoReplyEngine.generateReply({
  businessName: 'My Restaurant',
  businessCategory: 'Restaurant',
  reviewText: 'Food was amazing!',
  reviewRating: 5,
  reviewerName: 'Amit',
  language: 'hinglish',
  tone: 'grateful',
  sentiment: 'positive'
})
console.log(reply.reply) // AI-generated Hinglish reply
```

### 4. Get Dashboard Insights
```typescript
const insights = await insightsAggregator.generateDashboardInsights(
  'user_123',
  'location_456',
  30  // days
)
console.log(insights.overview.totalReviews)
console.log(insights.sentiment.positive)
console.log(insights.recommendations)
```

### 5. Use Translations
```typescript
const { t, language, setLanguage } = useTranslation()

// Display translated text
<h1>{t('insights.total_reviews')}</h1>

// Change language
<select onChange={(e) => setLanguage(e.target.value)}>
  <option value="en">English</option>
  <option value="hi">हिंदी</option>
  <option value="hinglish">Hinglish</option>
</select>
```

## 📊 API Response Examples

### Sentiment Analysis Response
```json
{
  "sentiment": "negative",
  "sentimentScore": 0.25,
  "emotion": "frustration",
  "emotionConfidence": 0.92,
  "detectedLanguage": "hinglish",
  "keyPhrases": ["slow service", "long wait"],
  "urgency": "high",
  "summary": "Customer frustrated with service delays"
}
```

### Auto-Reply Response
```json
{
  "reply": "Shukriya aapke review ke liye! Hum aapki feedback ko seriously lete hain...",
  "language": "hinglish",
  "tone": "grateful",
  "length": "medium",
  "qualityScore": 0.92,
  "warnings": []
}
```

### Dashboard Insights Response
```json
{
  "overview": {
    "totalReviews": 245,
    "averageRating": 4.2,
    "responseRate": 78,
    "avgResponseTime": 120
  },
  "sentiment": {
    "positive": 156,
    "neutral": 65,
    "negative": 24,
    "trend": "improving",
    "changePercent": 15
  },
  "topIssues": [
    {
      "issue": "Slow service",
      "frequency": 12,
      "severity": "high",
      "relatedReviews": 8
    }
  ],
  "recommendations": [
    {
      "type": "priority",
      "title": "Respond to Low Ratings",
      "description": "...",
      "impact": 0.9
    }
  ]
}
```

## 🎯 Environment Variables Checklist

```env
# Required for Alerts
✅ RESEND_API_KEY=
✅ TWILIO_ACCOUNT_SID=
✅ TWILIO_AUTH_TOKEN=
✅ TWILIO_PHONE_NUMBER=
✅ TWILIO_WHATSAPP_NUMBER=

# Required for AI Features
✅ OPENAI_API_KEY=

# Database
✅ MONGODB_URI=

# App Config
✅ NEXT_PUBLIC_BASE_URL=
```

## 🔄 Data Flow

```
Review Received
        ↓
Sentiment Analysis
        ↓
├─ Low Rating? (≤2) ──YES→ Trigger Alert
│                          Send Email/SMS/WhatsApp
│
└─ Insights Updated
   ├─ Dashboard Data Aggregated
   ├─ Trends Calculated
   └─ Recommendations Generated
        ↓
AI Reply Generator Ready
        ↓
User Reviews & Publishes
        ↓
Background Jobs Track Everything
        ↓
Weekly Report Generated
```

## 📈 Monitoring Checklist

- [ ] Alert delivery success rate >95%
- [ ] Sentiment analysis accuracy >85%
- [ ] Reply generation latency <2s
- [ ] Background jobs running on schedule
- [ ] API endpoints returning 200 status
- [ ] Database connection stable
- [ ] OpenAI API quota sufficient
- [ ] Twilio billing within limits

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Alerts not sending | Check RESEND_API_KEY, phone numbers valid |
| Sentiment inaccurate | Reviews need >20 chars, check API credits |
| Background jobs not running | Install cron: `npm install cron` |
| Reply generation slow | Check OpenAI rate limits, use batching |
| Dashboard empty | Ensure reviews exist in database |
| Language not detected | Provide explicit language parameter |

## 📞 Support Files

- **IMPLEMENTATION_GUIDE.md** - Complete setup & troubleshooting
- **MVP_IMPLEMENTATION_SUMMARY.md** - Feature overview & next steps
- **THIS FILE** - Quick reference

## 🚀 Deployment Checklist

- [ ] All env vars are set in production
- [ ] Database backups configured
- [ ] Background jobs initialized
- [ ] Email/SMS templates reviewed
- [ ] Reply compliance checks enabled
- [ ] Monitoring alerts configured
- [ ] Rate limiting enabled on APIs
- [ ] Error logging configured
- [ ] CDN cache headers set
- [ ] Security headers added

## 💰 Cost Optimization

| Service | Cost | Optimization |
|---------|------|--------------|
| OpenAI (GPT-4o-mini) | ~$0.01/reply | Batch processing, caching |
| Resend (Email) | Free tier covers 100/day | Use alerts strategically |
| Twilio (SMS) | $0.0075/SMS | Batch SMS, escalate carefully |
| MongoDB | $0 (use existing) | Index frequently queried fields |

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: May 9, 2026
