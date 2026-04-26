import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface IReview extends Document {
  locationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  googleReviewId: string
  reviewerName: string
  reviewerPhoto?: string
  rating: number
  comment?: string
  originalLanguage?: string
  detectedLanguage?: string
  translatedText?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  status: 'pending' | 'replied' | 'ignored' | 'scheduled'
  aiGeneratedReply?: string
  publishedReply?: string
  repliedAt?: Date
  scheduledAt?: Date
  lowRatingWhatsAppNotified?: boolean
  reviewCreatedAt: Date
  syncedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    googleReviewId: { type: String, required: true, index: true },
    reviewerName: { type: String, required: true },
    reviewerPhoto: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    originalLanguage: String,
    detectedLanguage: String,
    translatedText: String,
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    sentimentScore: { type: Number, min: -1, max: 1, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'replied', 'ignored', 'scheduled'],
      default: 'pending',
    },
    aiGeneratedReply: String,
    publishedReply: String,
    repliedAt: Date,
    scheduledAt: Date,
    lowRatingWhatsAppNotified: { type: Boolean, default: false },
    reviewCreatedAt: { type: Date, required: true, index: true },
    syncedAt: { type: Date, required: true },
  },
  { timestamps: true, strict: true }
)

ReviewSchema.index({ userId: 1, googleReviewId: 1 }, { unique: true })
ReviewSchema.index({ status: 1, scheduledAt: 1 })

const Review = (models.Review as Model<IReview>) || model<IReview>('Review', ReviewSchema)

export default Review
