import mongoose, { Document, Model, Schema, model, models } from 'mongoose'

export type EscalationStatus = 'open' | 'resolved'
export type EscalationAction = 'reply' | 'reach_out' | 'resolve'

export interface IEscalationTask extends Document {
  userId: mongoose.Types.ObjectId
  locationId: mongoose.Types.ObjectId
  reviewId: mongoose.Types.ObjectId
  status: EscalationStatus
  actionType: EscalationAction
  reason: string
  priority: 'high' | 'medium' | 'low'
  assignedTo?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const EscalationTaskSchema = new Schema<IEscalationTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true, unique: true, index: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
    actionType: { type: String, enum: ['reply', 'reach_out', 'resolve'], default: 'resolve' },
    reason: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    assignedTo: String,
    resolvedAt: Date,
  },
  { timestamps: true, strict: true }
)

EscalationTaskSchema.index({ userId: 1, status: 1, createdAt: -1 })

const EscalationTask =
  (models.EscalationTask as Model<IEscalationTask>) ||
  model<IEscalationTask>('EscalationTask', EscalationTaskSchema)

export default EscalationTask
