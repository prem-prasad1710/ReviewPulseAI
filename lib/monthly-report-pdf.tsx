import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Rect,
  renderToBuffer,
} from '@react-pdf/renderer'

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  brand: '#4f46e5',       // indigo-600
  brandDark: '#3730a3',   // indigo-800
  brandLight: '#e0e7ff',  // indigo-100
  accent: '#7c3aed',      // violet-600
  positive: '#16a34a',    // green-600
  positiveLight: '#dcfce7',
  neutral: '#ca8a04',     // yellow-600
  neutralLight: '#fef9c3',
  negative: '#dc2626',    // red-600
  negativeLight: '#fee2e2',
  text: '#0f172a',        // slate-900
  textMuted: '#64748b',   // slate-500
  textLight: '#94a3b8',   // slate-400
  border: '#e2e8f0',      // slate-200
  bg: '#f8fafc',          // slate-50
  white: '#ffffff',
  star: '#f59e0b',        // amber-500
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
    paddingBottom: 72,
  },

  // ── Header ──
  header: {
    backgroundColor: C.brand,
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 48,
    position: 'relative',
  },
  headerAccentBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: '100%',
    backgroundColor: C.accent,
    opacity: 0.35,
    borderBottomLeftRadius: 80,
  },
  headerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    color: '#a5b4fc',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#c7d2fe',
    marginBottom: 0,
  },
  headerBadge: {
    position: 'absolute',
    top: 32,
    right: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBadgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#e0e7ff',
    letterSpacing: 0.5,
  },

  // ── Body ──
  body: { paddingHorizontal: 48, paddingTop: 32 },

  // ── Score hero ──
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  scoreRing: { marginRight: 24 },
  scoreInfo: { flex: 1 },
  scoreBig: {
    fontSize: 52,
    fontFamily: 'Helvetica-Bold',
    color: C.brand,
    lineHeight: 1,
    marginBottom: 4,
  },
  gradeChip: {
    alignSelf: 'flex-start',
    backgroundColor: C.brandLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.brand,
    letterSpacing: 0.5,
  },
  scoreCaption: { fontSize: 10, color: C.textMuted, maxWidth: 280 },

  // ── Metric cards row ──
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  metricCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.textLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  metricValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 2 },
  metricSub: { fontSize: 9, color: C.textMuted },

  // ── Section header ──
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.text,
    letterSpacing: 0.3,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  // ── Sentiment bars ──
  sentimentSection: { marginBottom: 28 },
  sentimentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  sentimentDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sentimentLabel: { fontSize: 10, color: C.text, width: 68 },
  sentimentTrack: {
    flex: 1,
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  sentimentFill: { height: 8, borderRadius: 4 },
  sentimentPct: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.textMuted, width: 34, textAlign: 'right' },

  // ── Summary bullets ──
  summarySection: { marginBottom: 28 },
  bullet: { flexDirection: 'row', marginBottom: 8 },
  bulletDot: { fontSize: 10, color: C.brand, marginRight: 8, marginTop: 1 },
  bulletText: { fontSize: 10, color: C.text, flex: 1, lineHeight: 1.6 },

  // ── Recent reviews ──
  reviewsSection: { marginBottom: 24 },
  reviewCard: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.text },
  reviewStars: { fontSize: 10, color: C.star, letterSpacing: 1 },
  reviewComment: { fontSize: 9.5, color: C.textMuted, lineHeight: 1.55 },
  reviewChip: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  reviewChipText: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4 },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 48,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerBrand: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.textLight, letterSpacing: 0.8 },
  footerNote: { fontSize: 9, color: C.textLight },
  footerPage: { fontSize: 9, color: C.textLight },
})

// ── Helper components ─────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  const full = Math.round(Math.max(0, Math.min(5, n)))
  return <Text style={styles.reviewStars}>{'★'.repeat(full) + '☆'.repeat(5 - full)}</Text>
}

function SentimentBar({
  label,
  pct,
  color,
  bg,
}: {
  label: string
  pct: number
  color: string
  bg: string
}) {
  const capped = Math.max(0, Math.min(100, pct))
  return (
    <View style={styles.sentimentRow}>
      <View style={[styles.sentimentDot, { backgroundColor: color }]} />
      <Text style={styles.sentimentLabel}>{label}</Text>
      <View style={styles.sentimentTrack}>
        <View style={[styles.sentimentFill, { backgroundColor: bg, width: `${capped}%` }]} />
      </View>
      <Text style={styles.sentimentPct}>{capped.toFixed(0)}%</Text>
    </View>
  )
}

function ScoreRingSvg({ score }: { score: number }) {
  const R = 42
  const cx = 50
  const cy = 50
  const circumference = 2 * Math.PI * R
  const filled = circumference * (score / 100)
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      {/* Track */}
      <Circle cx={cx} cy={cy} r={R} stroke={C.brandLight} strokeWidth={9} fill="none" />
      {/* Progress — rotate so 0% starts at 12 o'clock */}
      <Circle
        cx={cx}
        cy={cy}
        r={R}
        stroke={C.brand}
        strokeWidth={9}
        fill="none"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Accent dot at fill end */}
      <Rect x={cx - 4} y={cy - R + 1} width={8} height={8} rx={4} fill={C.accent} />
    </Svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecentReviewEntry = {
  name: string
  rating: number
  comment: string
  sentiment: 'positive' | 'neutral' | 'negative'
  status: 'replied' | 'pending' | 'ignored' | 'scheduled'
}

export type MonthlyReportInput = {
  businessName: string
  address?: string
  monthLabel: string
  score: number
  grade: string
  totalReviews: number
  repliedCount: number
  avgRating: number
  positiveCount: number
  neutralCount: number
  negativeCount: number
  executiveSummary: string[]
  recentReviews?: RecentReviewEntry[]
  generatedAt?: string
}

// ── Keep old shape working (backward-compat shim) ─────────────────────────────
export type LegacyMonthlyReportInput = {
  businessName: string
  monthLabel: string
  score: number
  grade: string
  executiveSummary: string[]
  statsLines: string[]
}

// ── Document ──────────────────────────────────────────────────────────────────

function MonthlyReportDocument(props: MonthlyReportInput) {
  const { totalReviews, repliedCount, positiveCount, neutralCount, negativeCount } = props
  const replyRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 0
  const posPct = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0
  const neuPct = totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0
  const negPct = totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0
  const generatedStr = props.generatedAt
    ? new Date(props.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const reviews = props.recentReviews?.slice(0, 5) ?? []

  return (
    <Document title={`${props.businessName} — ${props.monthLabel} Reputation Report`} author="ReviewsPulse">
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerAccentBar} />
          <Text style={styles.headerLabel}>ReviewsPulse · Monthly Report</Text>
          <Text style={styles.headerTitle}>{props.businessName}</Text>
          <Text style={styles.headerSubtitle}>
            {props.address ? `${props.address}  ·  ` : ''}{props.monthLabel}
          </Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Grade {props.grade}</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── Score hero ── */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreRing}>
              <ScoreRingSvg score={props.score} />
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreBig}>{props.score}</Text>
              <View style={styles.gradeChip}>
                <Text style={styles.gradeText}>Grade {props.grade}</Text>
              </View>
              <Text style={styles.scoreCaption}>
                Reputation score out of 100 — based on average rating, reply rate, and sentiment ratio.
              </Text>
            </View>
          </View>

          {/* ── Metric cards ── */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Reviews</Text>
              <Text style={styles.metricValue}>{totalReviews}</Text>
              <Text style={styles.metricSub}>{repliedCount} replied</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Reply Rate</Text>
              <Text style={styles.metricValue}>{replyRate}%</Text>
              <Text style={styles.metricSub}>
                {replyRate >= 80 ? 'Excellent' : replyRate >= 50 ? 'Good' : 'Needs work'}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg Rating</Text>
              <Text style={styles.metricValue}>{props.avgRating.toFixed(1)}</Text>
              <Text style={styles.metricSub}>out of 5 stars</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Positive</Text>
              <Text style={styles.metricValue}>{posPct}%</Text>
              <Text style={styles.metricSub}>{positiveCount} reviews</Text>
            </View>
          </View>

          {/* ── Sentiment bars ── */}
          <View style={styles.sentimentSection}>
            <Text style={styles.sectionTitle}>Sentiment Breakdown</Text>
            <SentimentBar label="Positive" pct={posPct} color={C.positive} bg={C.positive} />
            <SentimentBar label="Neutral" pct={neuPct} color={C.neutral} bg={C.neutral} />
            <SentimentBar label="Negative" pct={negPct} color={C.negative} bg={C.negative} />
          </View>

          {/* ── Executive summary ── */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            {props.executiveSummary.map((line, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>›</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>

          {/* ── Recent reviews (if provided) ── */}
          {reviews.length > 0 ? (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Recent Customer Voices</Text>
              {reviews.map((r, i) => {
                const isPos = r.sentiment === 'positive'
                const isNeg = r.sentiment === 'negative'
                const chipBg = isPos ? C.positiveLight : isNeg ? C.negativeLight : C.neutralLight
                const chipTxt = isPos ? C.positive : isNeg ? C.negative : C.neutral
                const chipLabel = isPos ? 'Positive' : isNeg ? 'Negative' : 'Neutral'
                return (
                  <View key={i} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewName}>{r.name}</Text>
                      <Stars n={r.rating} />
                    </View>
                    {r.comment ? (
                      <Text style={styles.reviewComment}>
                        "{r.comment.slice(0, 200)}{r.comment.length > 200 ? '…' : ''}"
                      </Text>
                    ) : (
                      <Text style={[styles.reviewComment, { fontStyle: 'italic' }]}>No comment provided.</Text>
                    )}
                    <View style={[styles.reviewChip, { backgroundColor: chipBg }]}>
                      <Text style={[styles.reviewChipText, { color: chipTxt }]}>
                        {chipLabel}  ·  {r.status === 'replied' ? '✓ Replied' : 'Pending reply'}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          ) : null}

        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>REVIEWSPULSE.IN</Text>
          <Text style={styles.footerNote}>Generated {generatedStr}</Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function buildMonthlyReportBuffer(input: MonthlyReportInput | LegacyMonthlyReportInput): Promise<Buffer> {
  // Normalize legacy shape (statsLines only) → new shape
  let normalized: MonthlyReportInput
  if ('statsLines' in input && !('totalReviews' in input)) {
    const legacy = input as LegacyMonthlyReportInput
    // Parse statsLines: "Total reviews: 42", "Replied: 30", "Average rating: 4.20 / 5", "Positive sentiment: 30 (71%)"
    const num = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0
    const fl = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0
    const totalLine = legacy.statsLines.find((l) => l.startsWith('Total')) ?? ''
    const repliedLine = legacy.statsLines.find((l) => l.startsWith('Replied')) ?? ''
    const avgLine = legacy.statsLines.find((l) => l.startsWith('Average')) ?? ''
    const posLine = legacy.statsLines.find((l) => l.startsWith('Positive')) ?? ''
    const total = num(totalLine)
    const replied = num(repliedLine)
    const avg = fl(avgLine)
    const positive = num(posLine)
    const neutral = Math.round(total * 0.1)
    normalized = {
      businessName: legacy.businessName,
      monthLabel: legacy.monthLabel,
      score: legacy.score,
      grade: legacy.grade,
      executiveSummary: legacy.executiveSummary,
      totalReviews: total,
      repliedCount: replied,
      avgRating: avg,
      positiveCount: positive,
      neutralCount: neutral,
      negativeCount: Math.max(0, total - positive - neutral),
    }
  } else {
    normalized = input as MonthlyReportInput
  }

  const element = <MonthlyReportDocument {...normalized} />
  return renderToBuffer(element)
}
