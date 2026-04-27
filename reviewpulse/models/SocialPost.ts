import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ISocialPost extends Document {
  locationId: mongoose.Types.ObjectId
  reviewId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  platform: 'instagram' | 'whatsapp' | 'google'
  generatedText: string
  wasPostedToGoogle: boolean
  createdAt: Date
  updatedAt: Date
}

const SocialPostSchema = new Schema<ISocialPost>(
  {
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'whatsapp', 'google'], required: true },
    generatedText: { type: String, required: true },
    wasPostedToGoogle: { type: Boolean, default: false },
  },
  { timestamps: true, strict: true }
)

const SocialPost = (models.SocialPost as Model<ISocialPost>) || model<ISocialPost>('SocialPost', SocialPostSchema)

export default SocialPost
