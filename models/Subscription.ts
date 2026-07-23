import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId
  razorpaySubscriptionId: string
  razorpayPlanId: string
  plan: 'starter' | 'growth' | 'scale' | 'agency' | 'agency_addon'
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'cancelled' | 'completed' | 'expired'
  currentStart: Date
  currentEnd: Date
  paidCount: number
  firstOrderId?: string
  firstPaymentId?: string
  createdAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpaySubscriptionId: { type: String, required: true, unique: true, index: true },
    razorpayPlanId: { type: String, required: true },
    plan: { type: String, enum: ['starter', 'growth', 'scale', 'agency', 'agency_addon'], required: true },
    status: {
      type: String,
      enum: ['created', 'authenticated', 'active', 'paused', 'cancelled', 'completed', 'expired'],
      default: 'created',
    },
    currentStart: { type: Date, required: true },
    currentEnd: { type: Date, required: true },
    paidCount: { type: Number, default: 0 },
    firstOrderId: { type: String, index: true, sparse: true },
    firstPaymentId: { type: String, sparse: true },
  },
  { timestamps: true, strict: true }
)

const Subscription =
  (models.Subscription as Model<ISubscription>) || model<ISubscription>('Subscription', SubscriptionSchema)

export default Subscription
