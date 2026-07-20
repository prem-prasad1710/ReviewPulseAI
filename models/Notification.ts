import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'

export type NotificationType =
  | 'new_review'
  | 'crisis_alert'
  | 'velocity_spike'
  | 'streak_risk'
  | 'recovery_urgent'
  | 'health_drop'

export interface INotification extends Document {
  userId: Types.ObjectId
  type: NotificationType
  title: string
  body: string
  read: boolean
  linkHref: string
  locationId?: Types.ObjectId
  reviewId?: Types.ObjectId
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['new_review', 'crisis_alert', 'velocity_spike', 'streak_risk', 'recovery_urgent', 'health_drop'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 400 },
    read: { type: Boolean, default: false, index: true },
    linkHref: { type: String, required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Compound index for fast per-user unread queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })

// Auto-expire after 60 days to keep the collection lean
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 })

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification
