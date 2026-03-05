import mongoose, { Schema, Document } from 'mongoose';

export interface IAIDiagnosis extends Document {
  userId: string;
  disease: string;
  disease_code: string;
  confidence: number;
  treatment: string;
  stage: 'early' | 'mid' | 'advanced';
  spread_risk: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'critical';
  crop_type: string;
  image_url: string;
  createdAt: Date;
}

const AIDiagnosisSchema = new Schema<IAIDiagnosis>({
  userId: { type: String, required: true },
  disease: { type: String, required: true },
  disease_code: { type: String, default: '' },
  confidence: { type: Number, required: true },
  treatment: { type: String, required: true },
  stage: { type: String, enum: ['early', 'mid', 'advanced'], default: 'early' },
  spread_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  urgency: { type: String, enum: ['low', 'medium', 'critical'], default: 'low' },
  crop_type: { type: String, default: '' },
  image_url: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

AIDiagnosisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IAIDiagnosis>('AIDiagnosis', AIDiagnosisSchema);
