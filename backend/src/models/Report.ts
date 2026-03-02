import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterUserId: string;
  targetType: 'listing' | 'comment' | 'user' | 'message';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  reporterUserId: { type: String, required: true },
  targetType: { type: String, required: true, enum: ['listing', 'comment', 'user', 'message'] },
  targetId: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'resolved', 'dismissed'] },
  resolvedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);
