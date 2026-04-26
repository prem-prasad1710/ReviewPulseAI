import mongoose, { Document, Model, Schema, model, models } from 'mongoose'
import { ensureUniqueLocationSlug, slugifyLocationName } from '@/lib/location-slug'

const AlertKeywordSchema = new Schema(
  {
    keyword: { type: String, required: true },
    type: { type: String, enum: ['crisis', 'positive'], required: true },
    createdAt: { type: Date, default: () => new Date() },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
)

const ReplyScheduleSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    startHour: { type: Number, default: 9 },
    endHour: { type: Number, default: 18 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { _id: false }
)

const ReportEntrySchema = new Schema(
  {
    month: { type: String, required: true },
    url: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { _id: false }
)

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
  googlePlaceId?: string
  locationSlug?: string
  qrScans: number
  logoUrl?: string
  toneExamples: string[]
  alertKeywords: Array<{
    keyword: string
    type: 'crisis' | 'positive'
    createdAt: Date
    enabled: boolean
  }>
  replySchedule: {
    enabled: boolean
    startHour: number
    endHour: number
    workingDays: number[]
    timezone: string
  }
  reports: Array<{ month: string; url: string; generatedAt: Date }>
  lastPdfReportAt?: Date
  createdAt: Date
  updatedAt: Date
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
    googlePlaceId: String,
    locationSlug: { type: String, unique: true, sparse: true, index: true },
    qrScans: { type: Number, default: 0 },
    logoUrl: String,
    toneExamples: {
      type: [String],
      default: [],
      validate: [(arr: string[]) => arr.length <= 10, 'Max 10 tone examples'],
    },
    alertKeywords: { type: [AlertKeywordSchema], default: [] },
    replySchedule: { type: ReplyScheduleSchema, default: () => ({}) },
    reports: { type: [ReportEntrySchema], default: [] },
    lastPdfReportAt: Date,
  },
  { timestamps: true, strict: true }
)

LocationSchema.index({ userId: 1, googleLocationId: 1 }, { unique: true })

LocationSchema.pre('save', async function (next) {
  try {
    if (!this.locationSlug && mongoose.connection.readyState === 1) {
      this.locationSlug = await ensureUniqueLocationSlug(this.name, this._id as mongoose.Types.ObjectId)
    }
    if (!this.locationSlug) {
      this.locationSlug = `${slugifyLocationName(this.name)}-${Date.now()}`
    }
    next()
  } catch (e) {
    next(e as Error)
  }
})

const Location = (models.Location as Model<ILocation>) || model<ILocation>('Location', LocationSchema)

export default Location
