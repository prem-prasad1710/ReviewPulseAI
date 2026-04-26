import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId
  razorpaySubscriptionId: string
  razorpayPlanId: string
  plan: 'starter' | 'growth' | 'scale'
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'cancelled' | 'completed' | 'expired'
  currentStart: Date
  currentEnd: Date
  paidCount: number
  createdAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpaySubscriptionId: { type: String, required: true, unique: true, index: true },
    razorpayPlanId: { type: String, required: true },
    plan: { type: String, enum: ['starter', 'growth', 'scale'], required: true },
    status: {
      type: String,
      enum: ['created', 'authenticated', 'active', 'paused', 'cancelled', 'completed', 'expired'],
      default: 'created',
    },
    currentStart: { type: Date, required: true },
    currentEnd: { type: Date, required: true },
    paidCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
)

const Subscription =
  (models.Subscription as Model<ISubscription>) || model<ISubscription>('Subscription', SubscriptionSchema)

export default Subscription
