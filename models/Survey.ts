import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export type SurveyQuestion = { id: string; label: string; type: 'text' | 'rating' }

export interface ISurvey extends Document {
  userId: mongoose.Types.ObjectId
  locationId: mongoose.Types.ObjectId
  title: string
  slug: string
  questions: SurveyQuestion[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'rating'], required: true },
  },
  { _id: false }
)

const SurveySchema = new Schema<ISurvey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    questions: { type: [QuestionSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
)

const Survey = (models.Survey as Model<ISurvey>) || model<ISurvey>('Survey', SurveySchema)

export default Survey
