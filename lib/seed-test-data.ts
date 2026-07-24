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
import { encrypt } from '@/lib/crypto'

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
  const placeholderPlain = `${SEED_GOOGLE_ID_PREFIX}oauth-placeholder`
  let placeholderAccess = placeholderPlain
  let placeholderRefresh = placeholderPlain
  try {
    placeholderAccess = encrypt(placeholderPlain)
    placeholderRefresh = encrypt(placeholderPlain)
  } catch {
    /* ENCRYPTION_KEY missing — leave plain; sync will show a clear reconnect message */
  }

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
      accessToken: placeholderAccess,
      refreshToken: placeholderRefresh,
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

  // ── Expanded review dataset ─────────────────────────────────────────────
  // 60+ reviews spread over 40 days → unlocks mood heatmap, staff shoutouts,
  // menu insights, and all other analytics features.
  const revTemplates: RevSeed[] = [
    // ── Location 0 (Namma Kitchen — Indiranagar) ───────────────────────────
    { locationIdx: 0, reviewerName: 'Ananya K.', rating: 5, comment: 'Best biryani in town! Rahul at the counter was super helpful with spice levels. Will definitely be back.', sentiment: 'positive', sentimentScore: 0.88, emotion: 'gratitude', status: 'replied', days: 1, publishedReply: 'Thank you so much Ananya! Rahul will be thrilled to hear this. See you again soon!', repliedAt: daysAgo(0) },
    { locationIdx: 0, reviewerName: 'Vikram S.', rating: 2, comment: 'Waited 40 minutes for a table. Food was okay but billing queue was chaotic. Priya at the counter was rude.', sentiment: 'negative', sentimentScore: -0.65, emotion: 'frustration', status: 'pending', days: 2 },
    { locationIdx: 0, reviewerName: 'Meera P.', rating: 1, comment: 'Packaging leaked and butter chicken was cold on delivery. Very disappointed. This is the second time this month.', sentiment: 'negative', sentimentScore: -0.9, emotion: 'disappointment', status: 'pending', days: 3 },
    { locationIdx: 0, reviewerName: 'Rahul T.', rating: 4, comment: 'Solid dinner experience. Dal makhani was creamy and the naan was fresh. AC could be cooler in the back section.', sentiment: 'positive', sentimentScore: 0.52, emotion: 'neutral', status: 'replied', days: 5, publishedReply: 'Thanks Rahul—we are working on the AC in the back. Glad you loved the dal makhani!', repliedAt: daysAgo(4) },
    { locationIdx: 0, reviewerName: 'Divya N.', rating: 5, comment: 'Amazing mutton biryani! Suresh the chef really knows his spices. Came for my birthday and they made it special with a complimentary dessert.', sentiment: 'positive', sentimentScore: 0.91, emotion: 'joy', status: 'replied', days: 7, publishedReply: 'Happy birthday Divya! So glad Suresh could make your day special. Come back soon!', repliedAt: daysAgo(6) },
    { locationIdx: 0, reviewerName: 'Karthik V.', rating: 3, comment: 'Decent food but the raita was watery and the biryani was slightly dry today. Usually better than this.', sentiment: 'neutral', sentimentScore: 0.05, status: 'pending', days: 8 },
    { locationIdx: 0, reviewerName: 'Preethi L.', rating: 5, comment: 'Kavya at the front desk was so warm and welcoming. The paneer tikka masala was absolutely divine. 10/10 would recommend!', sentiment: 'positive', sentimentScore: 0.93, emotion: 'gratitude', status: 'replied', days: 9, publishedReply: 'Thank you Preethi! Kavya is a gem—we are so happy she made your experience special.', repliedAt: daysAgo(8) },
    { locationIdx: 0, reviewerName: 'Siddharth R.', rating: 4, comment: 'Good food and quick service on a busy Friday evening. The gulab jamun dessert was perfect. Deepak handled the rush very well.', sentiment: 'positive', sentimentScore: 0.67, emotion: 'joy', status: 'replied', days: 10, publishedReply: 'Thank you! Deepak works hard on busy evenings—will pass on the compliment!', repliedAt: daysAgo(9) },
    { locationIdx: 0, reviewerName: 'Lavanya B.', rating: 2, comment: 'Ordered chicken curry but got dal. When I complained Deepak was dismissive. The chai was good though.', sentiment: 'negative', sentimentScore: -0.58, emotion: 'frustration', status: 'pending', days: 11 },
    { locationIdx: 0, reviewerName: 'Nandini V.', rating: 5, comment: 'Sunday lunch with family was perfect. Kids loved the sweet lassi and adults enjoyed the chicken dum biryani. Rahul gave us a nice corner table.', sentiment: 'positive', sentimentScore: 0.87, emotion: 'joy', status: 'replied', days: 12, publishedReply: 'So wonderful to hear! Family Sundays are our favourite—Rahul loves setting up the right table. See you next week!', repliedAt: daysAgo(11) },
    { locationIdx: 0, reviewerName: 'Harish G.', rating: 1, comment: 'Found a hair in my biryani. Absolutely unacceptable hygiene. Will not return. Management please check kitchen standards.', sentiment: 'negative', sentimentScore: -0.95, emotion: 'anger', status: 'pending', days: 13 },
    { locationIdx: 0, reviewerName: 'Pooja M.', rating: 4, comment: 'Lovely ambience and great food. The chicken tikka starter was amazing. Waited a bit for dessert menu but worth it.', sentiment: 'positive', sentimentScore: 0.61, status: 'replied', days: 14, publishedReply: 'Thank you Pooja! We apologise for the dessert delay—we are speeding up service. Glad you enjoyed the tikka!', repliedAt: daysAgo(13) },
    { locationIdx: 0, reviewerName: 'Arun S.', rating: 5, comment: 'Best kheer I have ever had in Bangalore. Suresh the chef clearly uses good quality ingredients. My go-to place now.', sentiment: 'positive', sentimentScore: 0.89, emotion: 'gratitude', status: 'pending', days: 16 },
    { locationIdx: 0, reviewerName: 'Geetha R.', rating: 3, comment: 'Food quality was good but the restaurant was noisy and the tables were not cleaned quickly. Staff seemed overwhelmed.', sentiment: 'neutral', sentimentScore: -0.1, status: 'pending', days: 17 },
    { locationIdx: 0, reviewerName: 'Mohan K.', rating: 5, comment: 'Celebrated our anniversary here. Kavya arranged beautiful table decor without us asking. The lamb rogan josh was excellent.', sentiment: 'positive', sentimentScore: 0.94, emotion: 'gratitude', status: 'replied', days: 18, publishedReply: 'Happy anniversary! Kavya loves making special moments happen. Glad the rogan josh lived up to the occasion!', repliedAt: daysAgo(17) },
    { locationIdx: 0, reviewerName: 'Suma D.', rating: 4, comment: 'Consistently good quality. The chicken 65 starter and biryani combo is unbeatable. Portions could be slightly bigger.', sentiment: 'positive', sentimentScore: 0.55, status: 'pending', days: 20 },
    { locationIdx: 0, reviewerName: 'Venkat P.', rating: 2, comment: 'Dine-in experience was bad. Air conditioning was not working. Priya was unhelpful when we asked for a fan.', sentiment: 'negative', sentimentScore: -0.61, emotion: 'frustration', status: 'pending', days: 21 },
    { locationIdx: 0, reviewerName: 'Indu A.', rating: 5, comment: 'Absolutely loved the vegetarian thali! Everything from dal to kheer was fresh. This place is a hidden gem.', sentiment: 'positive', sentimentScore: 0.88, emotion: 'joy', status: 'replied', days: 22, publishedReply: 'Our thali is chef Suresh\'s labour of love! So glad you discovered us.', repliedAt: daysAgo(21) },
    { locationIdx: 0, reviewerName: 'Rajesh B.', rating: 4, comment: 'Good place for a team lunch. The corporate buffet deal is great value. Deepak was very accommodating for our group of 15.', sentiment: 'positive', sentimentScore: 0.70, status: 'replied', days: 24, publishedReply: 'Thank you for bringing your team! Deepak loves coordinating big groups.', repliedAt: daysAgo(23) },
    { locationIdx: 0, reviewerName: 'Jayashree N.', rating: 5, comment: 'The mango lassi here is the best in the city. Cold, creamy and not too sweet. Rahul suggested it when I was unsure.', sentiment: 'positive', sentimentScore: 0.85, emotion: 'joy', status: 'replied', days: 25, publishedReply: 'Rahul knows the menu inside-out! Our mango lassi is made fresh daily.', repliedAt: daysAgo(24) },
    { locationIdx: 0, reviewerName: 'Old Critic', rating: 2, comment: 'Service felt rushed and impersonal last month. Food quality has dropped.', sentiment: 'negative', sentimentScore: -0.4, status: 'replied', days: 28, ratingRecovered: true, publishedReply: 'We are sorry you felt that way—please ask for our manager next visit and we will make it right.', repliedAt: daysAgo(26) },
    { locationIdx: 0, reviewerName: 'Chandana K.', rating: 5, comment: 'Came here for a work dinner and was blown away by the mutton keema starter. Kavya helped us with a great table booking within 30 mins notice.', sentiment: 'positive', sentimentScore: 0.9, emotion: 'surprise', status: 'replied', days: 30, publishedReply: 'We love rising to the challenge! Kavya is our last-minute magic. Glad the keema hit the mark!', repliedAt: daysAgo(29) },
    { locationIdx: 0, reviewerName: 'Srinivasan T.', rating: 3, comment: 'Food was good. Service was slow. Overall average experience for the price.', sentiment: 'neutral', sentimentScore: 0.02, status: 'pending', days: 32 },
    { locationIdx: 0, reviewerName: 'Latha C.', rating: 4, comment: 'Great biryani as always. The new dessert menu is a great addition—tried the shahi tukda and it was fantastic.', sentiment: 'positive', sentimentScore: 0.68, status: 'replied', days: 33, publishedReply: 'Shahi tukda is our newest addition and already a crowd favourite! Thanks Latha.', repliedAt: daysAgo(32) },
    { locationIdx: 0, reviewerName: 'Praveen J.', rating: 1, comment: 'Ordered online but delivery took 90 minutes and food was cold. This is not acceptable for the price point.', sentiment: 'negative', sentimentScore: -0.85, emotion: 'anger', status: 'pending', days: 35 },
    { locationIdx: 0, reviewerName: 'Usha M.', rating: 5, comment: 'First time visit and I am already planning my second. The chicken malai tikka literally melted in my mouth. Suresh is a genius chef!', sentiment: 'positive', sentimentScore: 0.92, emotion: 'joy', status: 'pending', days: 37 },
    { locationIdx: 0, reviewerName: 'Bala R.', rating: 4, comment: 'Good value lunch. Rice was a tad overcooked but the gravy more than made up for it. Will come back for dinner.', sentiment: 'positive', sentimentScore: 0.48, status: 'pending', days: 39 },

    // ── Location 1 (Namma Kitchen — HSR) ──────────────────────────────────
    { locationIdx: 1, reviewerName: 'Kiran D.', rating: 5, comment: 'HSR outlet never disappoints! Quick seating on weekday lunch. Nisha at the counter remembered my order from last time.', sentiment: 'positive', sentimentScore: 0.88, emotion: 'joy', status: 'replied', days: 1, publishedReply: 'Thank you Kiran! Nisha has a great memory—glad to have regulars like you!', repliedAt: daysAgo(0) },
    { locationIdx: 1, reviewerName: 'Sneha R.', rating: 3, comment: 'Average experience today—delivery packaging needs work. The biryani container was partially open.', sentiment: 'neutral', sentimentScore: 0.05, status: 'scheduled', days: 4 },
    { locationIdx: 1, reviewerName: 'Arjun M.', rating: 2, comment: 'Staff forgot our water refill twice. Biryani taste was good but service spoiled the experience.', sentiment: 'negative', sentimentScore: -0.5, emotion: 'frustration', status: 'pending', days: 6 },
    { locationIdx: 1, reviewerName: 'Guest 8821', rating: 5, comment: 'Perfect lunch. Fast and fresh.', sentiment: 'positive', sentimentScore: 0.7, status: 'replied', days: 8, publishedReply: 'Thank you for the five stars! See you again.', repliedAt: daysAgo(7) },
    { locationIdx: 1, reviewerName: 'Swathi V.', rating: 5, comment: 'Came for team lunch—Nisha coordinated so well for our group. The veg biryani was excellent. Raita was perfect consistency.', sentiment: 'positive', sentimentScore: 0.86, emotion: 'gratitude', status: 'replied', days: 9, publishedReply: 'Nisha loves coordinating group lunches! Thank you for choosing us Swathi.', repliedAt: daysAgo(8) },
    { locationIdx: 1, reviewerName: 'Amit P.', rating: 4, comment: 'Really enjoyed the chicken 65 and biryani combo. Raju was very attentive throughout. Just wish the desserts were more varied.', sentiment: 'positive', sentimentScore: 0.60, status: 'replied', days: 11, publishedReply: 'Expanding dessert menu soon! Raju is one of our best—glad he looked after you.', repliedAt: daysAgo(10) },
    { locationIdx: 1, reviewerName: 'Chitra B.', rating: 1, comment: 'Got wrong order and when I called they put me on hold for 15 minutes. Nisha was apologetic but the damage was done.', sentiment: 'negative', sentimentScore: -0.82, emotion: 'anger', status: 'pending', days: 13 },
    { locationIdx: 1, reviewerName: 'Rohit T.', rating: 5, comment: 'The mutton keema naan combo is something else entirely. Raju suggested it and I am hooked. Quick delivery too.', sentiment: 'positive', sentimentScore: 0.91, emotion: 'joy', status: 'replied', days: 15, publishedReply: 'Raju has excellent food taste! The keema naan is a hidden gem. Come back soon Rohit!', repliedAt: daysAgo(14) },
    { locationIdx: 1, reviewerName: 'Aparna S.', rating: 3, comment: 'Decent food. The chicken curry was good but nothing wow. Ambience could be improved.', sentiment: 'neutral', sentimentScore: 0.08, status: 'pending', days: 17 },
    { locationIdx: 1, reviewerName: 'Vikram N.', rating: 4, comment: 'Solid HSR lunch spot. The dal tadka was authentic and the roti was fresh. Service by Nisha was prompt and warm.', sentiment: 'positive', sentimentScore: 0.65, status: 'replied', days: 19, publishedReply: 'Nisha takes pride in every interaction—thank you for noticing! Come again.', repliedAt: daysAgo(18) },
    { locationIdx: 1, reviewerName: 'Padma K.', rating: 2, comment: 'Stale bread in the starter basket. Raju apologised but the experience started on a bad note.', sentiment: 'negative', sentimentScore: -0.6, emotion: 'disappointment', status: 'pending', days: 21 },
    { locationIdx: 1, reviewerName: 'Aryan M.', rating: 5, comment: 'Best lunch buffet deal in HSR Layout. Fresh food every 20 mins. Great value for money.', sentiment: 'positive', sentimentScore: 0.84, emotion: 'joy', status: 'replied', days: 24, publishedReply: 'Our buffet team works hard to keep everything fresh! Thanks for the lovely review.', repliedAt: daysAgo(23) },
    { locationIdx: 1, reviewerName: 'Geeta L.', rating: 4, comment: 'Nice cozy corner. Ordered chicken tikka masala and naan—both excellent. The payasam dessert was a nice surprise.', sentiment: 'positive', sentimentScore: 0.72, status: 'pending', days: 27 },
    { locationIdx: 1, reviewerName: 'Kumar R.', rating: 5, comment: 'Ordered family pack for 8 people—everything arrived hot and fresh. Nisha was helpful with customisation requests.', sentiment: 'positive', sentimentScore: 0.88, emotion: 'gratitude', status: 'pending', days: 30 },
    { locationIdx: 1, reviewerName: 'Neha J.', rating: 3, comment: 'Food taste was good but quantity was less than expected for the price. Raju was polite when we brought it up.', sentiment: 'neutral', sentimentScore: 0.12, status: 'pending', days: 33 },
    { locationIdx: 1, reviewerName: 'Deepak S.', rating: 4, comment: 'Regular customer here—quality has been consistent for over a year. The chicken dum biryani is my weekly fix.', sentiment: 'positive', sentimentScore: 0.7, status: 'replied', days: 36, publishedReply: 'You are a true Namma Kitchen loyalist! The dum biryani is made with love every week.', repliedAt: daysAgo(35) },
    { locationIdx: 1, reviewerName: 'Sunita V.', rating: 2, comment: 'Long wait even with a prior booking. The food arrived 50 minutes after seating. Not a good sign.', sentiment: 'negative', sentimentScore: -0.62, emotion: 'frustration', status: 'pending', days: 38 },

    // ── Location 2 (ClinicNova — Jayanagar) ───────────────────────────────
    { locationIdx: 2, reviewerName: 'Patient A.', rating: 5, comment: 'Dr. Sharma explained the prescription clearly and patiently. Nurse Anjali was very gentle. Front desk was polite.', sentiment: 'positive', sentimentScore: 0.87, emotion: 'gratitude', status: 'replied', days: 2, publishedReply: 'Dr. Sharma and Anjali are our stars! Thank you for your kind words.', repliedAt: daysAgo(1) },
    { locationIdx: 2, reviewerName: 'Patient B.', rating: 4, comment: 'Good consultation with Dr. Sharma—waiting time was a bit long on Saturday but well worth it.', sentiment: 'positive', sentimentScore: 0.55, status: 'pending', days: 3 },
    { locationIdx: 2, reviewerName: 'Patient C.', rating: 1, comment: 'Billing error—charged twice on UPI. Called three times before getting a response. Very poor admin support.', sentiment: 'negative', sentimentScore: -0.88, emotion: 'anger', status: 'pending', days: 1 },
    { locationIdx: 2, reviewerName: 'Patient D.', rating: 5, comment: 'Kids vaccination camp was beautifully organised. Anjali made my daughter feel at ease. Will recommend to all parents.', sentiment: 'positive', sentimentScore: 0.9, emotion: 'joy', status: 'replied', days: 14, publishedReply: 'Anjali has such a gift with children! Thank you for bringing your daughter.', repliedAt: daysAgo(13) },
    { locationIdx: 2, reviewerName: 'Rohan G.', rating: 4, comment: 'Clean clinic and professional staff. Dr. Sharma gave a thorough diagnosis without rushing. Receptionist Meena was helpful.', sentiment: 'positive', sentimentScore: 0.68, status: 'replied', days: 5, publishedReply: 'Dr. Sharma takes every case seriously. Meena is a great point of contact—thank you Rohan!', repliedAt: daysAgo(4) },
    { locationIdx: 2, reviewerName: 'Lakshmi P.', rating: 3, comment: 'Decent care but waiting room is too small. Had to stand for 30 minutes. Doctor was good though.', sentiment: 'neutral', sentimentScore: 0.1, status: 'pending', days: 7 },
    { locationIdx: 2, reviewerName: 'Rajiv N.', rating: 5, comment: 'Had a complex follow-up and Dr. Sharma remembered every detail from my previous visit without looking at notes. Impressive!', sentiment: 'positive', sentimentScore: 0.93, emotion: 'surprise', status: 'replied', days: 10, publishedReply: 'Dr. Sharma is truly dedicated to every patient. Thank you for this lovely review Rajiv!', repliedAt: daysAgo(9) },
    { locationIdx: 2, reviewerName: 'Gita S.', rating: 2, comment: 'Meena was dismissive at the front desk. Had to repeat my insurance details three times. The clinical care was fine.', sentiment: 'negative', sentimentScore: -0.55, emotion: 'frustration', status: 'pending', days: 16 },
    { locationIdx: 2, reviewerName: 'Aditya K.', rating: 5, comment: 'Best general physician in Jayanagar. Always gets to the root cause. Anjali helped with follow-up scheduling quickly.', sentiment: 'positive', sentimentScore: 0.91, emotion: 'gratitude', status: 'replied', days: 20, publishedReply: 'Anjali goes the extra mile for follow-ups! Thank you for trusting us Aditya.', repliedAt: daysAgo(19) },
    { locationIdx: 2, reviewerName: 'Bhavna T.', rating: 4, comment: 'Professional and clean. A bit pricey for a consultation but the quality justifies it. Dr. Sharma is brilliant.', sentiment: 'positive', sentimentScore: 0.60, status: 'pending', days: 23 },
    { locationIdx: 2, reviewerName: 'Harsh V.', rating: 1, comment: 'Waited 2 hours past appointment time with no update. Completely disrespectful of patients time. Will not return.', sentiment: 'negative', sentimentScore: -0.9, emotion: 'anger', status: 'pending', days: 26 },
    { locationIdx: 2, reviewerName: 'Meera R.', rating: 5, comment: 'The health check package was comprehensive and affordable. Anjali and Meena handled everything smoothly. Very impressed!', sentiment: 'positive', sentimentScore: 0.88, emotion: 'joy', status: 'replied', days: 29, publishedReply: 'Our health packages are designed for comprehensive care! Anjali and Meena are wonderful. Thank you Meera!', repliedAt: daysAgo(28) },
    { locationIdx: 2, reviewerName: 'Suresh L.', rating: 3, comment: 'Okay clinic. Nothing exceptional. Dr. Sharma was okay but seemed hurried during my slot.', sentiment: 'neutral', sentimentScore: -0.05, status: 'pending', days: 32 },
    { locationIdx: 2, reviewerName: 'Kavitha N.', rating: 4, comment: 'Nice team. My elderly mother felt very comfortable here. Anjali took extra care explaining everything slowly. Good experience.', sentiment: 'positive', sentimentScore: 0.72, status: 'replied', days: 35, publishedReply: 'Anjali is so patient with elderly patients—thank you for noticing! Wishing your mother good health.', repliedAt: daysAgo(34) },
    { locationIdx: 2, reviewerName: 'Dhruv S.', rating: 5, comment: 'Third visit this year and every time the care quality is consistent. Dr. Sharma is simply the best in the area.', sentiment: 'positive', sentimentScore: 0.89, emotion: 'gratitude', status: 'pending', days: 38 },
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

  // ── Staff mention definitions matched to review text ─────────────────────
  // Each entry names the staff member, their location, sentiment, and the
  // relevant quote so the Staff Shoutouts panel has rich data.
  type StaffSeed = {
    locId: mongoose.Types.ObjectId
    reviewCommentFragment: string
    staffName: string
    sentiment: 'positive' | 'negative' | 'neutral'
    quote: string
  }
  const staffSeeds: StaffSeed[] = [
    // Loc 0 — Indiranagar
    { locId: loc0, reviewCommentFragment: 'Rahul at the counter was super helpful', staffName: 'Rahul', sentiment: 'positive', quote: 'Rahul at the counter was super helpful with spice levels' },
    { locId: loc0, reviewCommentFragment: 'Priya at the counter was rude', staffName: 'Priya', sentiment: 'negative', quote: 'Priya at the counter was rude' },
    { locId: loc0, reviewCommentFragment: 'Suresh the chef', staffName: 'Suresh', sentiment: 'positive', quote: 'Suresh the chef really knows his spices' },
    { locId: loc0, reviewCommentFragment: 'Kavya at the front desk was so warm', staffName: 'Kavya', sentiment: 'positive', quote: 'Kavya at the front desk was so warm and welcoming' },
    { locId: loc0, reviewCommentFragment: 'Deepak handled the rush', staffName: 'Deepak', sentiment: 'positive', quote: 'Deepak handled the rush very well' },
    { locId: loc0, reviewCommentFragment: 'Deepak was dismissive', staffName: 'Deepak', sentiment: 'negative', quote: 'When I complained Deepak was dismissive' },
    { locId: loc0, reviewCommentFragment: 'Rahul gave us a nice corner table', staffName: 'Rahul', sentiment: 'positive', quote: 'Rahul gave us a nice corner table' },
    { locId: loc0, reviewCommentFragment: 'Kavya arranged beautiful table decor', staffName: 'Kavya', sentiment: 'positive', quote: 'Kavya arranged beautiful table decor without us asking' },
    { locId: loc0, reviewCommentFragment: 'Suresh is a genius chef', staffName: 'Suresh', sentiment: 'positive', quote: 'Suresh is a genius chef! Chicken malai tikka literally melted in my mouth' },
    { locId: loc0, reviewCommentFragment: 'Kavya helped us with a great table', staffName: 'Kavya', sentiment: 'positive', quote: 'Kavya helped us with a great table booking within 30 mins notice' },
    { locId: loc0, reviewCommentFragment: 'Priya was unhelpful when we asked for a fan', staffName: 'Priya', sentiment: 'negative', quote: 'Priya was unhelpful when we asked for a fan' },
    { locId: loc0, reviewCommentFragment: 'Rahul suggested it when I was unsure', staffName: 'Rahul', sentiment: 'positive', quote: 'Rahul suggested the mango lassi when I was unsure' },
    // Loc 1 — HSR
    { locId: loc1, reviewCommentFragment: 'Nisha at the counter remembered my order', staffName: 'Nisha', sentiment: 'positive', quote: 'Nisha at the counter remembered my order from last time' },
    { locId: loc1, reviewCommentFragment: 'Nisha coordinated so well for our group', staffName: 'Nisha', sentiment: 'positive', quote: 'Nisha coordinated so well for our group' },
    { locId: loc1, reviewCommentFragment: 'Raju was very attentive', staffName: 'Raju', sentiment: 'positive', quote: 'Raju was very attentive throughout' },
    { locId: loc1, reviewCommentFragment: 'Nisha was apologetic but', staffName: 'Nisha', sentiment: 'neutral', quote: 'Nisha was apologetic but the damage was done' },
    { locId: loc1, reviewCommentFragment: 'Raju suggested it and I am hooked', staffName: 'Raju', sentiment: 'positive', quote: 'Raju suggested the keema naan and I am hooked' },
    { locId: loc1, reviewCommentFragment: 'Nisha was helpful with customisation', staffName: 'Nisha', sentiment: 'positive', quote: 'Nisha was helpful with customisation requests' },
    { locId: loc1, reviewCommentFragment: 'Raju was polite when we brought it up', staffName: 'Raju', sentiment: 'positive', quote: 'Raju was polite when we brought the portion issue up' },
    { locId: loc1, reviewCommentFragment: 'Service by Nisha was prompt and warm', staffName: 'Nisha', sentiment: 'positive', quote: 'Service by Nisha was prompt and warm' },
    { locId: loc1, reviewCommentFragment: 'Raju apologised but the experience', staffName: 'Raju', sentiment: 'neutral', quote: 'Raju apologised for the stale bread but the experience started on a bad note' },
    { locId: loc1, reviewCommentFragment: 'Staff forgot our water refill twice', staffName: 'Floor team', sentiment: 'negative', quote: 'Staff forgot our water refill twice' },
    // Loc 2 — Clinic
    { locId: loc2, reviewCommentFragment: 'Dr. Sharma explained the prescription', staffName: 'Dr. Sharma', sentiment: 'positive', quote: 'Dr. Sharma explained the prescription clearly and patiently' },
    { locId: loc2, reviewCommentFragment: 'Nurse Anjali was very gentle', staffName: 'Anjali', sentiment: 'positive', quote: 'Nurse Anjali was very gentle' },
    { locId: loc2, reviewCommentFragment: 'Receptionist Meena was helpful', staffName: 'Meena', sentiment: 'positive', quote: 'Receptionist Meena was helpful' },
    { locId: loc2, reviewCommentFragment: 'Anjali made my daughter feel at ease', staffName: 'Anjali', sentiment: 'positive', quote: 'Anjali made my daughter feel at ease during vaccination' },
    { locId: loc2, reviewCommentFragment: 'Dr. Sharma remembered every detail', staffName: 'Dr. Sharma', sentiment: 'positive', quote: 'Dr. Sharma remembered every detail from my previous visit' },
    { locId: loc2, reviewCommentFragment: 'Meena was dismissive at the front desk', staffName: 'Meena', sentiment: 'negative', quote: 'Meena was dismissive at the front desk' },
    { locId: loc2, reviewCommentFragment: 'Anjali helped with follow-up scheduling', staffName: 'Anjali', sentiment: 'positive', quote: 'Anjali helped with follow-up scheduling quickly' },
    { locId: loc2, reviewCommentFragment: 'Anjali and Meena handled everything smoothly', staffName: 'Anjali', sentiment: 'positive', quote: 'Anjali and Meena handled everything smoothly' },
    { locId: loc2, reviewCommentFragment: 'Anjali took extra care explaining everything slowly', staffName: 'Anjali', sentiment: 'positive', quote: 'Anjali took extra care explaining everything slowly for my elderly mother' },
    { locId: loc2, reviewCommentFragment: 'Anjali and Meena handled everything smoothly', staffName: 'Meena', sentiment: 'positive', quote: 'Anjali and Meena handled everything smoothly' },
  ]

  for (const ss of staffSeeds) {
    const rev = inserted.find((r) => (r.comment || '').includes(ss.reviewCommentFragment))
    if (rev) {
      await StaffMention.create({
        locationId: ss.locId,
        userId: uid,
        reviewId: rev._id,
        staffName: ss.staffName,
        sentiment: ss.sentiment,
        quote: ss.quote,
        reviewDate: rev.reviewCreatedAt,
        isStaff: true,
      })
      staffCount++
    }
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