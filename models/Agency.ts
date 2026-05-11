import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface IAgency extends Document {
  ownerId: mongoose.Types.ObjectId
  name: string
  slug: string
  logoUrl?: string
  primaryColor?: string
  customDomain?: string
  clientIds: mongoose.Types.ObjectId[]
  plan: 'agency'
  razorpaySubscriptionId?: string
  inviteToken: string
  createdAt: Date
  updatedAt: Date
}

const AgencySchema = new Schema<IAgency>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: String,
    primaryColor: String,
    customDomain: String,
    clientIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    plan: { type: String, enum: ['agency'], default: 'agency' },
    razorpaySubscriptionId: String,
    inviteToken: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true, strict: true }
)

const Agency = (models.Agency as Model<IAgency>) || model<IAgency>('Agency', AgencySchema)

export default Agency
