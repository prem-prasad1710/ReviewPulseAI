import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ICompetitor extends Document {
  locationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  placeId: string
  name: string
  address?: string
  lastAnalyzedAt?: Date
  themes: { positive: string[]; negative: string[] }
  createdAt: Date
  updatedAt: Date
}

const CompetitorSchema = new Schema<ICompetitor>(
  {
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    placeId: { type: String, required: true },
    name: { type: String, required: true },
    address: String,
    lastAnalyzedAt: Date,
    themes: {
      positive: { type: [String], default: [] },
      negative: { type: [String], default: [] },
    },
  },
  { timestamps: true, strict: true }
)

CompetitorSchema.index({ locationId: 1, placeId: 1 }, { unique: true })

const Competitor =
  (models.Competitor as Model<ICompetitor>) || model<ICompetitor>('Competitor', CompetitorSchema)

export default Competitor
