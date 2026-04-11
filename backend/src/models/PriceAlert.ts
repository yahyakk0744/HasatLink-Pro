import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceAlert extends Document {
  userId: string;
  category: string;
  subCategory: string;
  targetPrice: number;
  keyword: string;
  condition: 'below' | 'above';
  isActive: boolean;
  createdAt: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, default: '' },
  targetPrice: { type: Number, required: true },
  keyword: { type: String, default: '' },
  condition: { type: String, enum: ['below', 'above'], default: 'below' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

PriceAlertSchema.index({ category: 1, isActive: 1, targetPrice: 1 });

export default mongoose.model<IPriceAlert>('PriceAlert', PriceAlertSchema);
