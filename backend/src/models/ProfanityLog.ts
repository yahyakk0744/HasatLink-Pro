import mongoose, { Schema, Document } from 'mongoose';

export interface IProfanityLog extends Document {
  userId: string;
  field: string;
  content: string;
  endpoint: string;
  createdAt: Date;
}

const ProfanityLogSchema = new Schema<IProfanityLog>({
  userId: { type: String, required: true },
  field: { type: String, required: true },
  content: { type: String, required: true },
  endpoint: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

ProfanityLogSchema.index({ createdAt: -1 });

export default mongoose.model<IProfanityLog>('ProfanityLog', ProfanityLogSchema);
