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
  whatsappAlertsDayKey?: string
  whatsappAlertsSent?: number
  agencyId?: mongoose.Types.ObjectId
  agencyLocationAddons?: number
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
    whatsappAlertsDayKey: String,
    whatsappAlertsSent: { type: Number, default: 0 },
    agencyId: { type: Schema.Types.ObjectId, ref: 'Agency' },
    agencyLocationAddons: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', UserSchema)

export default User
