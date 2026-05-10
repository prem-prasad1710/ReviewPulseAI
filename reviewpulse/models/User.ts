import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export type UserPlan = 'free' | 'starter' | 'growth' | 'scale' | 'agency'

export interface IUser extends Document {
  googleId: string
  email: string
  name: string
  image?: string
  plan: UserPlan
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due'
  trialEndsAt?: Date
  repliesUsedThisMonth: number
  repliesResetAt: Date
  whatsappNumber?: string
  /** Master switch for Twilio WhatsApp alerts (low-star + keyword). Default on when unset. */
  whatsappAlertsEnabled?: boolean
  whatsappAlertsDayKey?: string
  whatsappAlertsSent?: number
  agencyId?: mongoose.Types.ObjectId
  agencyLocationAddons?: number
  /** B1 — rate limit WhatsApp bot commands per UTC day. */
  whatsappBotDayKey?: string
  whatsappBotInteractions?: number
  /** G1 — public REST API bearer key. */
  publicApiKey?: string
  /** H4 — partner referral code for this account. */
  partnerReferralCode?: string
  referredByUserId?: mongoose.Types.ObjectId
  /** B3 — last bulk festival greeting to superfans (rate limit). */
  superFanFestivalSentAt?: Date
  /** 9.1 — Voice reply via WhatsApp: pin which review the next voice note applies to. */
  whatsappVoicePin?: {
    reviewId: mongoose.Types.ObjectId
    expiresAt: Date
  }
  /** Whisper + GPT draft awaiting *haan* / *yes* to publish to GBP. */
  whatsappVoiceDraft?: {
    reviewId: mongoose.Types.ObjectId
    locationId: mongoose.Types.ObjectId
    replyText: string
    createdAt: Date
  }
  whatsappVoiceDayKey?: string
  whatsappVoiceNotesSent?: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    image: String,
    plan: { type: String, enum: ['free', 'starter', 'growth', 'scale', 'agency'], default: 'free' },
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'inactive',
    },
    trialEndsAt: Date,
    repliesUsedThisMonth: { type: Number, default: 0 },
    repliesResetAt: { type: Date, default: () => new Date() },
    whatsappNumber: String,
    whatsappAlertsEnabled: { type: Boolean, default: true },
    whatsappAlertsDayKey: String,
    whatsappAlertsSent: { type: Number, default: 0 },
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency' },
    agencyLocationAddons: { type: Number, default: 0 },
    whatsappBotDayKey: String,
    whatsappBotInteractions: { type: Number, default: 0 },
    publicApiKey: { type: String, sparse: true, unique: true, index: true },
    partnerReferralCode: { type: String, sparse: true, unique: true, index: true },
    referredByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    superFanFestivalSentAt: Date,
    whatsappVoicePin: {
      reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
      expiresAt: Date,
    },
    whatsappVoiceDraft: {
      reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
      locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
      replyText: { type: String, maxlength: 1200 },
      createdAt: Date,
    },
    whatsappVoiceDayKey: String,
    whatsappVoiceNotesSent: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', UserSchema)

export default User
