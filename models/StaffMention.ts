import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface IStaffMention extends Document {
  locationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  reviewId: mongoose.Types.ObjectId
  staffName: string
  sentiment: 'positive' | 'negative' | 'neutral'
  quote: string
  reviewDate: Date
  isStaff: boolean
  createdAt: Date
  updatedAt: Date
}

const StaffMentionSchema = new Schema<IStaffMention>(
  {
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    staffName: { type: String, required: true, index: true },
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], required: true },
    quote: { type: String, required: true },
    reviewDate: { type: Date, required: true },
    isStaff: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
)

StaffMentionSchema.index({ locationId: 1, staffName: 1 })
StaffMentionSchema.index({ reviewId: 1, staffName: 1 }, { unique: true })

const StaffMention =
  (models.StaffMention as Model<IStaffMention>) || model<IStaffMention>('StaffMention', StaffMentionSchema)

export default StaffMention
