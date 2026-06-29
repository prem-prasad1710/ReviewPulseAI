import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Competitor from '@/models/Competitor'
import EscalationTask from '@/models/EscalationTask'
import ImportedReview from '@/models/ImportedReview'
import Location from '@/models/Location'
import Review from '@/models/Review'
import ReviewAlert from '@/models/ReviewAlert'
import SocialPost from '@/models/SocialPost'
import StaffMention from '@/models/StaffMention'
import Survey from '@/models/Survey'
import User from '@/models/User'

/** Prefix for synthetic GBP rows — safe to delete without touching real OAuth locations. */
export const SEED_GOOGLE_ID_PREFIX = 'rp-seed-'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12 + (n % 5), 0, 0, 0)
  return d
}

export async function removeSeedDataForUser(userId: string | mongoose.Types.ObjectId) {
  await connectDB()
  const uid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId

  const seedLocs = await Location.find({
    userId: uid,
    googleLocationId: { $regex: `^${SEED_GOOGLE_ID_PREFIX}` },
  })
    .select('_id')
    .lean()
  const locIds = seedLocs.map((l) => l._id)

  if (locIds.length === 0) {
    await Review.deleteMany({ userId: uid, googleReviewId: { $regex: `^${SEED_GOOGLE_ID_PREFIX}rev-` } })
    return { deletedLocations: 0, deletedReviews: 0 }
  }

  const revs = await Review.find({ locationId: { $in: locIds } }).select('_id').lean()
  const revIds = revs.map((r) => r._id)

  await StaffMention.deleteMany({ reviewId: { $in: revIds } })
  await Review.deleteMany({ locationId: { $in: locIds } })
  await Competitor.deleteMany({ locationId: { $in: locIds } })
  await Location.deleteMany({ _id: { $in: locIds } })

  const orphan = await Review.deleteMany({ userId: uid, googleReviewId: { $regex: `^${SEED_GOOGLE_ID_PREFIX}rev-` } })
  return { deletedLocations: locIds.length, deletedReviews: revs.length + orphan.deletedCount }
}

export type PurgeLocationDataResult = {
  deletedLocations: number
  deletedReviews: number
  deletedCompetitors: number
  deletedAlerts: number
  deletedStaffMentions: number
  deletedEscalations: number
  deletedImportedReviews: number
  deletedSocialPosts: number
  deletedSurveys: number
}

/** Removes every location and review (and related rows) for a user — use before a clean re-seed or real GBP reconnect. */
export async function purgeAllLocationDataForUser(
  userId: string | mongoose.Types.ObjectId
): Promise<PurgeLocationDataResult> {
  await connectDB()
  const uid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId

  const locs = await Location.find({ userId: uid }).select('_id').lean()
  const locIds = locs.map((l) => l._id)

  const revs = await Review.find({ userId: uid }).select('_id').lean()
  const revIds = revs.map((r) => r._id)

  const empty: PurgeLocationDataResult = {
    deletedLocations: 0,
    deletedReviews: 0,
    deletedCompetitors: 0,
    deletedAlerts: 0,
    deletedStaffMentions: 0,
    deletedEscalations: 0,
    deletedImportedReviews: 0,
    deletedSocialPosts: 0,
    deletedSurveys: 0,
  }

  if (locIds.length === 0 && revIds.length === 0) return empty

  const staff = await StaffMention.deleteMany(
    revIds.length ? { reviewId: { $in: revIds } } : { locationId: { $in: locIds } }
  )
  const alerts = await ReviewAlert.deleteMany({ userId: uid })
  const esc = await EscalationTask.deleteMany({ userId: uid })
  const social = await SocialPost.deleteMany({ locationId: { $in: locIds } })
  const imported = await ImportedReview.deleteMany({ locationId: { $in: locIds } })
  const competitors = await Competitor.deleteMany({ locationId: { $in: locIds } })
  const surveys = await Survey.deleteMany({ locationId: { $in: locIds } })
  const reviews = await Review.deleteMany({ userId: uid })
  const locations = await Location.deleteMany({ userId: uid })

  await User.updateOne({ _id: uid }, { $unset: { whatsappVoicePin: '', whatsappVoiceDraft: '' } })

  return {
    deletedLocations: locations.deletedCount ?? 0,
    deletedReviews: reviews.deletedCount ?? 0,
    deletedCompetitors: competitors.deletedCount ?? 0,
    deletedAlerts: alerts.deletedCount ?? 0,
    deletedStaffMentions: staff.deletedCount ?? 0,
    deletedEscalations: esc.deletedCount ?? 0,
    deletedImportedReviews: imported.deletedCount ?? 0,
    deletedSocialPosts: social.deletedCount ?? 0,
    deletedSurveys: surveys.deletedCount ?? 0,
  }
}

async function refreshLocationStats(locationId: mongoose.Types.ObjectId) {
  const agg = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { locationId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  const row = agg[0]
  const totalReviews = row?.count ?? 0
  const averageRating = row?.avg != null ? Math.round(row.avg * 10) / 10 : 0
  await Location.updateOne(
    { _id: locationId },
    { $set: { totalReviews, averageRating, lastSyncedAt: new Date(), lastKnownReviewCount: totalReviews } }
  )
}

export type SeedTestDataResult = {
  userId: string
  email: string
  planUpdated: boolean
  plan: string
  locationsCreated: number
  reviewsCreated: number
  competitorsCreated: number
  staffMentionsCreated: number
  previousSeedRemoved: { deletedLocations: number; deletedReviews: number }
}

export async function seedTestDataForUserId(
  userId: string,
  options?: { upgradePlan?: boolean; plan?: 'growth' | 'scale'; purgeAll?: boolean }
): Promise<SeedTestDataResult> {
  await connectDB()
  const uid = new mongoose.Types.ObjectId(userId)
  const user = await User.findById(uid).lean()
  if (!user?.email) throw new Error('User not found')

  const removed = options?.purgeAll
    ? await purgeAllLocationDataForUser(uid)
    : await removeSeedDataForUser(uid)

  const upgradePlan = options?.upgradePlan !== false
  const targetPlan = options?.plan ?? 'scale'
  if (upgradePlan) {
    await User.updateOne(
      { _id: uid },
      { $set: { plan: targetPlan, subscriptionStatus: 'active', trialEndsAt: new Date(Date.now() + 365 * 86400000) } }
    )
  }

  const tokenFar = new Date(Date.now() + 365 * 86400000)
  const placeholderToken = `${SEED_GOOGLE_ID_PREFIX}oauth-placeholder`

  const locSpecs = [
    {
      name: 'Namma Kitchen — Indiranagar',
      address: '100 12th Main Rd, Indiranagar, Bengaluru 560038',
      category: 'Restaurant',
      businessType: 'restaurant' as const,
      qrScans: 142,
      bridgeVisits: 38,
    },
    {
      name: 'Namma Kitchen — HSR',
      address: '24th Main, Sector 2, HSR Layout, Bengaluru 560102',
      category: 'Restaurant',
      businessType: 'restaurant' as const,
      qrScans: 89,
      bridgeVisits: 21,
    },
    {
      name: 'ClinicNova — Jayanagar',
      address: '9th Block, Jayanagar, Bengaluru 560069',
      category: 'Medical clinic',
      businessType: 'clinic' as const,
      qrScans: 56,
      bridgeVisits: 64,
    },
  ]

  const createdLocs: mongoose.Document[] = []
  for (let i = 0; i < locSpecs.length; i++) {
    const spec = locSpecs[i]!
    const doc = await Location.create({
      userId: uid,
      googleLocationId: `${SEED_GOOGLE_ID_PREFIX}loc-${i + 1}`,
      googleAccountId: `${SEED_GOOGLE_ID_PREFIX}account`,
      name: spec.name,
      address: spec.address,
      category: spec.category,
      businessType: spec.businessType,
      phone: '+91 80 4000 0000',
      accessToken: placeholderToken,
      refreshToken: placeholderToken,
      tokenExpiresAt: tokenFar,
      isActive: true,
      totalReviews: 0,
      averageRating: 0,
      qrScans: spec.qrScans,
      bridgeVisits: spec.bridgeVisits,
      lastSyncedAt: new Date(),
      alertKeywords: [
        { keyword: 'food poisoning', type: 'crisis' as const, enabled: true },
        { keyword: 'hygiene', type: 'crisis' as const, enabled: true },
        { keyword: 'birthday', type: 'positive' as const, enabled: true },
      ],
    })
    createdLocs.push(doc)
  }

  const loc0 = createdLocs[0]!._id as mongoose.Types.ObjectId
  const loc1 = createdLocs[1]!._id as mongoose.Types.ObjectId
  const loc2 = createdLocs[2]!._id as mongoose.Types.ObjectId

  type RevSeed = {
    locationIdx: 0 | 1 | 2
    reviewerName: string
    rating: number
    comment?: string
    sentiment: 'positive' | 'neutral' | 'negative'
    sentimentScore: number
    emotion?: 'joy' | 'frustration' | 'gratitude' | 'disappointment' | 'anger' | 'surprise' | 'neutral'
    status: 'pending' | 'replied' | 'ignored' | 'scheduled'
    days: number
    ratingRecovered?: boolean
    aiGeneratedReply?: string
    publishedReply?: string
    repliedAt?: Date
  }

  const revTemplates: RevSeed[] = [
    {
      locationIdx: 0,
      reviewerName: 'Ananya K.',
      rating: 5,
      comment: 'Best biryani in town—Rahul at the counter was super helpful with spice levels.',
      sentiment: 'positive',
      sentimentScore: 0.82,
      emotion: 'gratitude',
      status: 'replied',
      days: 1,
      aiGeneratedReply: 'Thank you so much—we are glad Rahul could help you pick the right spice level.',
      publishedReply: 'Thank you so much—we are glad Rahul could help you pick the right spice level.',
      repliedAt: daysAgo(0),
    },
    {
      locationIdx: 0,
      reviewerName: 'Vikram S.',
      rating: 2,
      comment: 'Waited 40 minutes for a table. Food was okay but billing queue was chaotic.',
      sentiment: 'negative',
      sentimentScore: -0.65,
      emotion: 'frustration',
      status: 'pending',
      days: 2,
    },
    {
      locationIdx: 0,
      reviewerName: 'Meera P.',
      rating: 1,
      comment: 'Packaging leaked and butter chicken was cold. Very disappointed.',
      sentiment: 'negative',
      sentimentScore: -0.9,
      emotion: 'disappointment',
      status: 'pending',
      days: 3,
    },
    {
      locationIdx: 0,
      reviewerName: 'Rahul T.',
      rating: 4,
      comment: 'Solid dinner—AC could be cooler in the back section.',
      sentiment: 'positive',
      sentimentScore: 0.45,
      emotion: 'neutral',
      status: 'replied',
      days: 5,
      publishedReply: 'Thanks for the honest feedback—we are looking at AC comfort in the back section.',
      repliedAt: daysAgo(4),
    },
    {
      locationIdx: 0,
      reviewerName: 'Old Critic',
      rating: 2,
      comment: 'Service felt rushed last month.',
      sentiment: 'negative',
      sentimentScore: -0.4,
      status: 'replied',
      days: 28,
      ratingRecovered: true,
      publishedReply: 'We are sorry you felt rushed—please ask for me next visit.',
      repliedAt: daysAgo(26),
    },
    {
      locationIdx: 1,
      reviewerName: 'Kiran D.',
      rating: 5,
      comment: 'HSR outlet never disappoints—quick seating on weekday lunch.',
      sentiment: 'positive',
      sentimentScore: 0.78,
      emotion: 'joy',
      status: 'replied',
      days: 0,
      publishedReply: 'Thank you—we love seeing you for weekday lunch!',
      repliedAt: daysAgo(0),
    },
    {
      locationIdx: 1,
      reviewerName: 'Sneha R.',
      rating: 3,
      comment: 'Average experience—delivery packaging needs work.',
      sentiment: 'neutral',
      sentimentScore: 0.05,
      status: 'scheduled',
      days: 4,
    },
    {
      locationIdx: 1,
      reviewerName: 'Arjun M.',
      rating: 2,
      comment: 'Staff forgot our water refill twice. Biryani taste was good.',
      sentiment: 'negative',
      sentimentScore: -0.5,
      emotion: 'frustration',
      status: 'pending',
      days: 6,
    },
    {
      locationIdx: 1,
      reviewerName: 'Guest 8821',
      rating: 5,
      comment: '',
      sentiment: 'positive',
      sentimentScore: 0.3,
      status: 'replied',
      days: 10,
      publishedReply: 'Thank you for the five stars!',
      repliedAt: daysAgo(9),
    },
    {
      locationIdx: 2,
      reviewerName: 'Patient A.',
      rating: 5,
      comment: 'Dr. Sharma explained the prescription clearly. Front desk was polite.',
      sentiment: 'positive',
      sentimentScore: 0.85,
      emotion: 'gratitude',
      status: 'replied',
      days: 2,
      publishedReply: 'We are glad the visit was clear and comfortable—thank you.',
      repliedAt: daysAgo(1),
    },
    {
      locationIdx: 2,
      reviewerName: 'Patient B.',
      rating: 4,
      comment: 'Good consultation—waiting time was a bit long on Saturday.',
      sentiment: 'positive',
      sentimentScore: 0.5,
      status: 'pending',
      days: 3,
    },
    {
      locationIdx: 2,
      reviewerName: 'Patient C.',
      rating: 1,
      comment: 'Billing error—charged twice on UPI. Please refund.',
      sentiment: 'negative',
      sentimentScore: -0.88,
      emotion: 'anger',
      status: 'pending',
      days: 1,
    },
    {
      locationIdx: 2,
      reviewerName: 'Patient D.',
      rating: 5,
      comment: 'Kids vaccination camp was well organised.',
      sentiment: 'positive',
      sentimentScore: 0.8,
      status: 'replied',
      days: 14,
      publishedReply: 'Thank you for trusting us with the vaccination camp.',
      repliedAt: daysAgo(13),
    },
  ]

  const locIds = [loc0, loc1, loc2]
  const now = new Date()
  const reviewDocs = revTemplates.map((t, i) => ({
    locationId: locIds[t.locationIdx]!,
    userId: uid,
    googleReviewId: `${SEED_GOOGLE_ID_PREFIX}rev-${i + 1}-${uid.toString().slice(-6)}`,
    reviewerName: t.reviewerName,
    rating: t.rating,
    comment: t.comment,
    sentiment: t.sentiment,
    sentimentScore: t.sentimentScore,
    emotion: t.emotion,
    status: t.status,
    reviewCreatedAt: daysAgo(t.days),
    syncedAt: now,
    aiGeneratedReply: t.aiGeneratedReply,
    publishedReply: t.publishedReply,
    repliedAt: t.repliedAt,
    scheduledAt: t.status === 'scheduled' ? daysAgo(t.days - 1) : undefined,
    ratingRecovered: Boolean(t.ratingRecovered),
    ratingRecoveredAt: t.ratingRecovered ? daysAgo(24) : undefined,
    ratingMonitoringUntil:
      t.rating <= 2 && !t.ratingRecovered ? new Date(Date.now() + 14 * 86400000) : undefined,
    autopsy:
      t.rating <= 2 && t.comment
        ? {
            rootCause: 'Operational friction (wait or billing)',
            suggestedFix: 'Acknowledge delay, offer manager contact, tighten billing checks.',
            generatedAt: daysAgo(t.days - 1),
          }
        : undefined,
  }))

  const inserted = await Review.insertMany(reviewDocs)
  let staffCount = 0
  const r0 = inserted[0]
  if (r0 && (r0.comment || '').includes('Rahul')) {
    await StaffMention.create({
      locationId: loc0,
      userId: uid,
      reviewId: r0._id,
      staffName: 'Rahul',
      sentiment: 'positive',
      quote: 'Rahul at the counter was super helpful',
      reviewDate: r0.reviewCreatedAt,
      isStaff: true,
    })
    staffCount++
  }
  const negStaff = inserted.find((r) => (r.comment || '').includes('Staff forgot'))
  if (negStaff) {
    await StaffMention.create({
      locationId: loc1,
      userId: uid,
      reviewId: negStaff._id,
      staffName: 'Floor team',
      sentiment: 'negative',
      quote: 'Staff forgot our water refill twice',
      reviewDate: negStaff.reviewCreatedAt,
      isStaff: true,
    })
    staffCount++
  }

  await Competitor.create({
    locationId: loc0,
    userId: uid,
    placeId: `${SEED_GOOGLE_ID_PREFIX}comp-rival-biryani`,
    name: 'Rival Biryani House (sample)',
    address: 'Indiranagar, Bengaluru',
    lastAnalyzedAt: new Date(),
    themes: {
      positive: ['Generous portions', 'Late-night hours'],
      negative: ['Long delivery', 'Inconsistent spice'],
    },
  })
  await Competitor.create({
    locationId: loc0,
    userId: uid,
    placeId: `${SEED_GOOGLE_ID_PREFIX}comp-rival-cafe`,
    name: 'Neighbourhood Cafe (sample)',
    address: 'Near CMH Road',
    lastAnalyzedAt: new Date(),
    themes: {
      positive: ['Ambience', 'Coffee'],
      negative: ['Parking', 'Slow service peak hours'],
    },
  })

  for (const loc of createdLocs) {
    await refreshLocationStats(loc._id as mongoose.Types.ObjectId)
  }

  const fresh = await User.findById(uid).lean()

  return {
    userId: String(uid),
    email: user.email,
    planUpdated: upgradePlan,
    plan: String(fresh?.plan ?? user.plan),
    locationsCreated: createdLocs.length,
    reviewsCreated: inserted.length,
    competitorsCreated: 2,
    staffMentionsCreated: staffCount,
    previousSeedRemoved: {
      deletedLocations: removed.deletedLocations,
      deletedReviews: removed.deletedReviews,
    },
  }
}

export async function resetAndSeedUserEmail(
  email: string,
  options?: { upgradePlan?: boolean; plan?: 'growth' | 'scale' }
): Promise<SeedTestDataResult & { purged: PurgeLocationDataResult }> {
  await connectDB()
  const trimmed = email.trim()
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const user = await User.findOne({ email: new RegExp(`^${escaped}$`, 'i') }).lean()
  if (!user?._id) {
    throw new Error(`No user with email "${trimmed}". Sign in once with Google so the account exists, then run again.`)
  }
  const purged = await purgeAllLocationDataForUser(user._id)
  const seeded = await seedTestDataForUserId(String(user._id), { ...options, purgeAll: false })
  return { ...seeded, purged }
}

export async function seedTestDataForUserEmail(
  email: string,
  options?: { upgradePlan?: boolean; plan?: 'growth' | 'scale'; purgeAll?: boolean }
): Promise<SeedTestDataResult> {
  await connectDB()
  const trimmed = email.trim()
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const user = await User.findOne({ email: new RegExp(`^${escaped}$`, 'i') }).lean()
  if (!user?._id) {
    throw new Error(`No user with email "${trimmed}". Sign in once with Google so the account exists, then run again.`)
  }
  return seedTestDataForUserId(String(user._id), options)
}