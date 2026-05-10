import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export interface ISurveyResponse extends Document {
  surveyId: mongoose.Types.ObjectId
  answers: Record<string, string | number>
  createdAt: Date
}

const SurveyResponseSchema = new Schema<ISurveyResponse>(
  {
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
    answers: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, strict: true }
)

const SurveyResponse =
  (models.SurveyResponse as Model<ISurveyResponse>) ||
  model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema)

export default SurveyResponse
