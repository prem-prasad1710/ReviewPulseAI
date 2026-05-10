import type { Types } from 'mongoose'
import { computeFakeScore } from '@/lib/fake-score'
import {
  extractStaffMentionsFromReview,
  runReviewAutopsy,
} from '@/lib/openai'
import {
  planAllowsFakeScore,
  planAllowsReviewAutopsy,
  planAllowsStaffTracker,
} from '@/lib/plan-access'
import Location from '@/models/Location'
import Review from '@/models/Review'
import ReviewAlert from '@/models/ReviewAlert'
import StaffMention from '@/models/StaffMention'
import User from '@/models/User'

const FAKE_ALERT_KEYWORD = '__inauthentic_pattern__'

/** Async Z1–Z4 jobs after a review is saved (do not block sync response). */
export function enqueueZeroOneAfterSync(reviewDbId: Types.ObjectId): void {
  void runZeroOneAfterSync(reviewDbId).catch((e) => console.error('runZeroOneAfterSync:', e))
}

async function runZeroOneAfterSync(reviewDbId: Types.ObjectId): Promise<void> {
  const review = await Review.findById(reviewDbId).lean()
  if (!review) return

  const [location, user] = await Promise.all([
    Location.findById(review.locationId).lean(),
    User.findById(review.userId).lean(),
  ])
  if (!location || !user) return

  const plan = user.plan as string

  if (planAllowsFakeScore(plan)) {
    const recent = await Review.find({
      locationId: review.locationId,
    })
      .select('_id reviewCreatedAt')
      .sort({ reviewCreatedAt: -1 })
      .limit(120)
      .lean()

    const { score, signals } = computeFakeScore(
      {
        _id: review._id,
        comment: review.comment,
        rating: review.rating,
        reviewerName: review.reviewerName,
        reviewCreatedAt: review.reviewCreatedAt,
      },
      recent
    )
    await Review.findByIdAndUpdate(review._id, {
      $set: { fakeScore: score, fakeSignals: signals },
    })

    if (score >= 40) {
      const exists = await ReviewAlert.findOne({
        reviewId: review._id,
        type: 'fake_suspected',
      }).lean()
      if (!exists) {
        await ReviewAlert.create({
          locationId: review.locationId,
          reviewId: review._id,
          userId: review.userId,
          keyword: FAKE_ALERT_KEYWORD,
          type: 'fake_suspected',
          fakeScore: score,
          fakeSignals: signals,
          notifiedAt: new Date(),
        })
      }
    }
  }

  if (
    planAllowsReviewAutopsy(plan) &&
    review.rating <= 2 &&
    (location.totalReviews ?? 0) >= 10 &&
    !review.autopsy
  ) {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const negatives = await Review.find({
      locationId: review.locationId,
      rating: { $lte: 2 },
      reviewCreatedAt: { $gte: ninetyDaysAgo },
    })
      .select('comment rating')
      .limit(80)
      .lean()

    const lines = negatives
      .map((r) => `- "${(r.comment || '').slice(0, 400)}" (${r.rating} stars)`)
      .filter((l) => l.length > 12)

    const autopsy = await runReviewAutopsy({
      businessName: location.name,
      businessCategory: location.category || 'business',
      negativeReviewLines: lines,
    })

    if (autopsy) {
      await Review.findByIdAndUpdate(review._id, {
        $set: {
          autopsy: {
            rootCause: autopsy.rootCause,
            suggestedFix: autopsy.suggestedFix,
            generatedAt: new Date(),
          },
        },
      })
    }
  }

  if (
    planAllowsStaffTracker(plan) &&
    review.comment &&
    !review.staffMentionsExtracted
  ) {
    const mentions = await extractStaffMentionsFromReview(review.comment)
    if (mentions.length > 0) {
      for (const m of mentions) {
        try {
          await StaffMention.create({
            locationId: review.locationId,
            userId: review.userId,
            reviewId: review._id,
            staffName: m.name,
            sentiment: m.sentiment,
            quote: m.quote,
            reviewDate: review.reviewCreatedAt,
            isStaff: true,
          })
        } catch {
          /* duplicate reviewId+staffName */
        }
      }
    }
    await Review.findByIdAndUpdate(review._id, { $set: { staffMentionsExtracted: true } })
  }
}
