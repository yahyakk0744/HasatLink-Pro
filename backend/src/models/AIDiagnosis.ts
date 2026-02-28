import mongoose, { Schema, Document } from 'mongoose';

export interface IAIDiagnosis extends Document {
  userId: string;
  disease: string;
  confidence: number;
  treatment: string;
  createdAt: Date;
}

const AIDiagnosisSchema = new Schema<IAIDiagnosis>({
  userId: { type: String, required: true },
  disease: { type: String, required: true },
  confidence: { type: Number, required: true },
  treatment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

AIDiagnosisSchema.index({ userId: 1 });

export default mongoose.model<IAIDiagnosis>('AIDiagnosis', AIDiagnosisSchema);
