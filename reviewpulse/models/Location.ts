import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ILocation extends Document {
  userId: mongoose.Types.ObjectId
  googleLocationId: string
  googleAccountId: string
  name: string
  address: string
  phone?: string
  category?: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
  lastSyncedAt?: Date
  totalReviews: number
  averageRating: number
  isActive: boolean
  createdAt: Date
}

const LocationSchema = new Schema<ILocation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    googleLocationId: { type: String, required: true, index: true },
    googleAccountId: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: String,
    category: String,
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    lastSyncedAt: Date,
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
)

LocationSchema.index({ userId: 1, googleLocationId: 1 }, { unique: true })

const Location = (models.Location as Model<ILocation>) || model<ILocation>('Location', LocationSchema)

export default Location
