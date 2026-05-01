/** v2 roadmap registry — links into dashboard + APIs (single hub). */

export type V2FeatureCard = {
  id: string
  title: string
  blurb: string
  href: string
  scope: 'workspace' | 'location'
}

export const V2_FEATURE_CARDS: V2FeatureCard[] = [
  { id: 'A1', title: 'Review emotion heatmap', blurb: '90-day emotion buckets per outlet.', href: '/locations', scope: 'location' },
  { id: 'A2', title: 'Review prediction engine', blurb: 'Heuristic risk tier from text + stars.', href: '/locations', scope: 'location' },
  { id: 'A3', title: 'Competitor battle card PDF', blurb: 'Export themes vs tracked rival.', href: '/locations', scope: 'location' },
  { id: 'A4', title: 'Customer journey mapper', blurb: 'Stages by vertical (F3).', href: '/locations', scope: 'location' },
  { id: 'A5', title: 'Auto-reply A/B testing', blurb: 'Two AI styles; variant stored on generate.', href: '/locations', scope: 'location' },
  { id: 'A6', title: 'Seasonal menu intelligence', blurb: 'Uses Scale menu insights + calendar.', href: '/locations', scope: 'location' },
  { id: 'B1', title: 'WhatsApp digest bot', blurb: 'Inbound commands via Twilio webhook.', href: '/settings', scope: 'workspace' },
  { id: 'B2', title: 'WhatsApp review requests', blurb: 'Weekly automation cron + template.', href: '/locations', scope: 'location' },
  { id: 'B3', title: 'Festival superfans WhatsApp', blurb: 'Festival greeting when 5★ depth exists.', href: '/settings', scope: 'workspace' },
  { id: 'B4', title: 'Interactive WhatsApp buttons', blurb: 'Use Twilio Content API / templates in Meta.', href: '/v2', scope: 'workspace' },
  { id: 'C1', title: 'Rating recovery tracker', blurb: 'Sync detects star increases + alert.', href: '/locations', scope: 'location' },
  { id: 'C2', title: 'Hyper-local benchmark', blurb: 'Percentile vs baseline curve.', href: '/locations', scope: 'location' },
  { id: 'C3', title: 'Review velocity dashboard', blurb: 'Workspace analytics.', href: '/analytics', scope: 'workspace' },
  { id: 'C4', title: 'Time-of-day patterns', blurb: 'Mood heatmap hour × weekday.', href: '/locations', scope: 'location' },
  { id: 'C5', title: 'Multi-location leaderboard', blurb: 'Rank outlets on your account.', href: '/leaderboard', scope: 'workspace' },
  { id: 'C6', title: 'Investor reputation PDF', blurb: 'One-pager export.', href: '/locations', scope: 'location' },
  { id: 'D1', title: 'Review removal detector', blurb: 'GBP count drop sets alert timestamp.', href: '/locations', scope: 'location' },
  { id: 'D2', title: 'Compliance mode', blurb: 'Healthcare / legal / finance prompts.', href: '/locations', scope: 'location' },
  { id: 'D3', title: 'Brand voice score', blurb: 'Overlap vs tone examples.', href: '/locations', scope: 'location' },
  { id: 'D4', title: 'Crisis mode', blurb: 'Pauses scheduled replies.', href: '/locations', scope: 'location' },
  { id: 'E1', title: 'Zomato / Swiggy sync', blurb: 'Stub connector — OAuth not bundled.', href: '/integrations', scope: 'workspace' },
  { id: 'E2', title: 'Google Ads connector', blurb: 'Stub status flags per outlet.', href: '/integrations', scope: 'workspace' },
  { id: 'E3', title: 'Justdial / IndiaMart', blurb: 'Stub connector.', href: '/integrations', scope: 'workspace' },
  { id: 'E4', title: 'SEO review schema', blurb: 'JSON-LD public route.', href: '/locations', scope: 'location' },
  { id: 'F1', title: 'Highlight reel manifest', blurb: 'JSON for video editors (Remotion-ready).', href: '/locations', scope: 'location' },
  { id: 'F2', title: 'Super fan identifier', blurb: 'Repeat 5★ reviewers.', href: '/locations', scope: 'location' },
  { id: 'F3', title: 'Vertical dashboards', blurb: 'Business type + journey.', href: '/locations', scope: 'location' },
  { id: 'F4', title: 'Customer surveys', blurb: 'Public link + responses.', href: '/locations', scope: 'location' },
  { id: 'G1', title: 'Public REST API', blurb: 'Bearer key + v1 reviews JSON.', href: '/settings', scope: 'workspace' },
  { id: 'G2', title: 'Live score badge', blurb: 'SVG + impressions.', href: '/locations', scope: 'location' },
  { id: 'G3', title: 'Data export CSV', blurb: 'Paid CSV download.', href: '/locations', scope: 'location' },
  { id: 'H1', title: 'Verification badge', blurb: 'Trust SVG + schema.', href: '/locations', scope: 'location' },
  { id: 'H2', title: 'Managed reply queue', blurb: 'Escalation flag per outlet.', href: '/locations', scope: 'location' },
  { id: 'H3', title: 'Template store', blurb: 'Bundled copy blocks.', href: '/templates', scope: 'workspace' },
  { id: 'H4', title: 'Partner referrals', blurb: 'Shareable RP- codes.', href: '/partner', scope: 'workspace' },
]
