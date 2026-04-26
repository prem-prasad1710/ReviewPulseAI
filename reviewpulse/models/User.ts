import { Document, Model, Schema, model, models } from 'mongoose'

export interface IUser extends Document {
  googleId: string
  email: string
  name: string
  image?: string
  plan: 'free' | 'starter' | 'growth' | 'scale'
  razorpayCustomerId?: string
  razorpaySubscriptionId?: string
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due'
  trialEndsAt?: Date
  repliesUsedThisMonth: number
  repliesResetAt: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    image: String,
    plan: { type: String, enum: ['free', 'starter', 'growth', 'scale'], default: 'free' },
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
  },
  { timestamps: true, strict: true }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', UserSchema)

export default User
