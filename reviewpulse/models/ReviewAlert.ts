import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface IReviewAlert extends Document {
  locationId: mongoose.Types.ObjectId
  reviewId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  keyword: string
  type: 'crisis' | 'positive'
  notifiedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ReviewAlertSchema = new Schema<IReviewAlert>(
  {
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    keyword: { type: String, required: true },
    type: { type: String, enum: ['crisis', 'positive'], required: true },
    notifiedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true, strict: true }
)

ReviewAlertSchema.index({ reviewId: 1, keyword: 1 }, { unique: true })

const ReviewAlert =
  (models.ReviewAlert as Model<IReviewAlert>) || model<IReviewAlert>('ReviewAlert', ReviewAlertSchema)

export default ReviewAlert
