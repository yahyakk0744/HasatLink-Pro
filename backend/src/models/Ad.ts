import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  slot: 'header' | 'sidebar' | 'footer' | 'between-listings';
  enabled: boolean;
  imageUrl: string;
  clickUrl: string;
  startDate: Date;
  endDate: Date;
  clickCount: number;
  impressionCount: number;
  createdAt: Date;
}

const AdSchema = new Schema<IAd>({
  slot: {
    type: String,
    enum: ['header', 'sidebar', 'footer', 'between-listings'],
    required: true,
  },
  enabled: { type: Boolean, default: false },
  imageUrl: { type: String, required: true },
  clickUrl: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  clickCount: { type: Number, default: 0 },
  impressionCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

AdSchema.index({ slot: 1, enabled: 1, startDate: 1, endDate: 1 });

export default mongoose.model<IAd>('Ad', AdSchema);
