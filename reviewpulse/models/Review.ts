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
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  status: 'pending' | 'replied' | 'ignored'
  aiGeneratedReply?: string
  publishedReply?: string
  repliedAt?: Date
  reviewCreatedAt: Date
  syncedAt: Date
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
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    sentimentScore: { type: Number, min: -1, max: 1, default: 0 },
    status: { type: String, enum: ['pending', 'replied', 'ignored'], default: 'pending' },
    aiGeneratedReply: String,
    publishedReply: String,
    repliedAt: Date,
    reviewCreatedAt: { type: Date, required: true, index: true },
    syncedAt: { type: Date, required: true },
  },
  { timestamps: true, strict: true }
)

ReviewSchema.index({ userId: 1, googleReviewId: 1 }, { unique: true })

const Review = (models.Review as Model<IReview>) || model<IReview>('Review', ReviewSchema)

export default Review
