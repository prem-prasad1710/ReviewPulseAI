import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

/** E1 — reviews imported from Zomato (or other CSV) separate from GBP `Review` docs. */
export interface IImportedReview extends Document {
  locationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  source: 'zomato'
  externalKey: string
  reviewerName: string
  rating: number
  comment: string
  reviewCreatedAt: Date
  rawRowHash: string
  createdAt: Date
  updatedAt: Date
}

const ImportedReviewSchema = new Schema<IImportedReview>(
  {
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, enum: ['zomato'], required: true, default: 'zomato' },
    externalKey: { type: String, required: true },
    reviewerName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    reviewCreatedAt: { type: Date, required: true },
    rawRowHash: { type: String, required: true },
  },
  { timestamps: true, strict: true }
)

ImportedReviewSchema.index({ locationId: 1, source: 1, externalKey: 1 }, { unique: true })

const ImportedReview =
  (models.ImportedReview as Model<IImportedReview>) ||
  model<IImportedReview>('ImportedReview', ImportedReviewSchema)

export default ImportedReview
