import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ICompetitor extends Document {
  locationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  placeId: string
  name: string
  address?: string
  /** Cached Google Places Details snapshot — dashboard reads this; cron refreshes. */
  placesSnapshotFetchedAt?: Date
  placeRating?: number
  placeUserRatingsTotal?: number
  cachedReviewSnippets?: Array<{
    author_name?: string
    rating?: number
    text?: string
    time?: number
  }>
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
    placesSnapshotFetchedAt: { type: Date, index: true },
    placeRating: { type: Number, min: 1, max: 5 },
    placeUserRatingsTotal: { type: Number, min: 0 },
    cachedReviewSnippets: {
      type: [
        {
          author_name: String,
          rating: { type: Number, min: 1, max: 5 },
          text: String,
          time: Number,
        },
      ],
      default: [],
    },
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
