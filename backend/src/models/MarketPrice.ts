import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketPrice extends Document {
  name: string;
  nameEn: string;
  price: number;
  previousPrice: number;
  change: number;
  unit: string;
  category: string;
  updatedAt: Date;
}

const MarketPriceSchema = new Schema<IMarketPrice>({
  name: { type: String, required: true },
  nameEn: { type: String, required: true },
  price: { type: Number, required: true },
  previousPrice: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  unit: { type: String, default: '₺/kg' },
  category: { type: String, default: 'sebze' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMarketPrice>('MarketPrice', MarketPriceSchema);
